import { el, setStyle } from 'redom';
import { API_URL } from './commons';
import { getItem } from "./storage";

export function matchesRegex(str) {
    let reg = /https:\/\/www\.faceit\.com\/([a-z]*)\/csgo\/room\/([a-zA-Z0-9\-]*)$/
    return reg.test(str)
}

window.onload = () => {
    let url = location.href;
    if (matchesRegex(url)) {
        validateAndRun();
    }
};

chrome.runtime.onMessage.addListener(
    function (newUrl, sender, callback) {
        console.log('Detected url change. The new one is: ' + newUrl);
        validateAndRun();
    });

function validateAndRun() {
    getItem('enableTuscan', result => {
        let enabled = result.enableTuscan;
        if (enabled === 'true') {
            getItem('statsExpanded', statsResult => {
                run(statsResult.statsExpanded === 'true');
            });
        } else {
            console.log('Faceit lobby extension turned off.')
        }
    });
}

function run(statsExpanded) {

    // Find players HTML elements
    let teamMemberElements = document.getElementsByClassName('match-team-member__details__name');

    // Execute when ready
    if (teamMemberElements.length === 10) {

        // Check if extension elements has not been injected to the DOM already
        let tuscanElements = document.getElementsByClassName('tuscan-stats');
        if (tuscanElements.length === 0) {
            injectApp(teamMemberElements, statsExpanded);
        }
    } else {
        // Or wait and retry
        setTimeout(() => run(statsExpanded), 1000);
    }
}

function injectApp(teamMemberElements, statsExpanded) {

    // Extract nicknames from player elements
    let nicknames = Array.from(teamMemberElements).map(el => {
        return el.querySelector('strong').innerText
    });

    // Append Tuscan.pro link for every player
    nicknames.forEach(nickname => {
        Array.from(teamMemberElements).filter(el => el.querySelector('strong').innerText === nickname).map(el => {
            return el.appendChild(getTuscanLink(nickname));
        })
    });

    // Divide players into 2 factions
    let faction1 = nicknames.slice(0, 5);
    let faction2 = nicknames.slice(5);

    // Construct table
    doFaction(faction1, teamMemberElements, statsExpanded);
    doFaction(faction2, teamMemberElements, statsExpanded);
}

function setupExpandableDivWithChevron(statsExpanded, table) {
    const divContainer = el('div');
    setStyle(divContainer, {
        borderTop: '1px solid rgb(31, 31, 31)',
        height: statsExpanded ? '100%' : '26px'
    });
    const chevron = divContainer.appendChild(el('span'));
    setStyle(chevron, {
        margin: '6px 8px 10px 0',
        display: 'inline-block',
        borderRight: '2px solid #fff',
        borderBottom: '2px solid #fff',
        cursor: 'pointer',
        width: '10px',
        height: '10px',
        transform: statsExpanded ? 'rotate(45deg)' : 'rotate(-135deg)',
        float: 'right'
    });
    divContainer.appendChild(chevron);
    divContainer.appendChild(table);
    chevron.addEventListener('click', () => {
        if (table.style.display === 'none') {
            chevron.style.transform = 'rotate(45deg)';
            divContainer.style.height = '100%';
            table.style.display = null;
        } else {
            chevron.style.transform = 'rotate(-135deg)';
            divContainer.style.height = '26px';
            table.style.display = 'none';
        }
    });
    return divContainer;
}

function doFaction(faction, teamMemberElements, statsExpanded) {

    // Prepare query param
    let query = queryParam(faction);

    // Compose URL to Tuscan service
    const url = `${API_URL}/tuscan-api/plugin/players/details/csgo${query}`;

    let mapStatsList;

    // Execute request
    fetch(url).then(data => {
        data.json().then(data => {

            mapStatsList = data;

            // Create table for each player in faction
            mapStatsList.forEach(stat => {

                // Create table element:
                let table = el('table', { className: 'tuscan-stats text-sm' });

                setStyle(table, {
                    width: '100%',
                    color: '#777',
                    backgroundColor: '#181818',
                    marginBottom: '10px',
                    borderTop: '1px solid #1f1f1f',
                    transition: 'all 1s ease',
                    display: statsExpanded ? null : 'none'
                });

                // Define table head
                let heads = [
                    el('td', 'map'),
                    el('td', 'matches'),
                    el('td', 'wins'),
                    el('td', 'win%'),
                    el('td', 'kdRatio')
                ];

                heads.forEach(t => t.style.cursor = 'pointer');
                let tr = el('tr', heads, { className: "map-head" });
                table.appendChild(tr);

                // Check sorting method
                getItem('mapOrderSelect', result => {
                    // Then create a table row for each map
                    let orderBy = result['mapOrderSelect'];
                    if (orderBy === 'winpercentage') {
                        stat.mapStats.sort((a, b) => (a.winPercentage < b.winPercentage) ? 1 : -1)
                            .map(map => createMapRow(map))
                            .forEach(mapRow => table.appendChild(mapRow));
                    } else if (orderBy === 'count') {
                        stat.mapStats.sort((a, b) => (a.matches < b.matches) ? 1 : -1)
                            .map(map => createMapRow(map))
                            .forEach(mapRow => table.appendChild(mapRow));
                    } else {
                        stat.mapStats.sort((a, b) => (a.kdRatio < b.kdRatio) ? 1 : -1)
                            .map(map => createMapRow(map))
                            .forEach(mapRow => table.appendChild(mapRow));
                    }
                });

                const divContainer = setupExpandableDivWithChevron(statsExpanded, table);

                // Append constructed table to correlated HTML node
                Array.from(teamMemberElements).filter(el => el.querySelector('strong').innerText === stat.nickname)
                    .map(el => {
                        el.parentNode.parentNode.parentNode.firstElementChild.appendChild(divContainer);
                        return el
                    });

                const getCellValue = (tr, idx) => tr.children[idx].innerText || tr.children[idx].textContent;

                const comparer = (idx, asc) => (a, b) => ((v1, v2) =>
                        v1 !== '' && v2 !== '' && !isNaN(v1) && !isNaN(v2) ? v1 - v2 : v1.toString().localeCompare(v2)
                )(getCellValue(asc ? a : b, idx), getCellValue(asc ? b : a, idx));

                document.querySelectorAll('.map-head')
                    .forEach(heads =>
                        heads.querySelectorAll("td")
                            .forEach(th => th.addEventListener('click', (() => {
                                const table = th.closest('table');
                                Array.from(table.querySelectorAll('tr:nth-child(n+2)'))
                                    .sort(comparer(Array.from(th.parentNode.children).indexOf(th), false))
                                    .forEach(tr => table.appendChild(tr));
                            }))));
            });
        })
    })
}

function createMapRow(map) {
    return el('tr',
        el('td', map.csgoMap.toLowerCase()),
        el('td', map.matches),
        el('td', `${map.wins}`),
        el('td', map.winPercentage),
        el('td', map.kdRatio)
    );
}

function getTuscanLink(nickname) {
    return el('a', {
        title: `${nickname} TUSCAN stats`,
        href: `https://tuscan.pro/player/${nickname}`,
        target: '_blank'
    }, 'Tuscan Stats');
}

function queryParam(nicknames) {
    return `?nickname=${nicknames.toString()}`;
}
