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
        cursor: 'pointer',
        height: statsExpanded ? '100%' : '26px'
    });
    const chevron = divContainer.appendChild(el('span'));
    setStyle(chevron, {
        margin: '6px 8px 10px 0',
        display: 'inline-block',
        borderRight: '2px solid #fff',
        borderBottom: '2px solid #fff',
        width: '10px',
        height: '10px',
        transform: statsExpanded ? 'rotate(45deg)' : 'rotate(-135deg)',
        float: 'right'
    });
    divContainer.appendChild(chevron);
    divContainer.appendChild(table);
    divContainer.addEventListener('click', () => {
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

                // Define columns
                let tr = el('tr', el('td', 'map'), el('td', 'matches'), el('td', 'wins'), el('td', 'kdRatio'));
                table.appendChild(tr);

                // Sort maps by K/D ratio, then create a table row for each map
                stat.mapStats.sort((a, b) => (a.kdRatio < b.kdRatio) ? 1 : -1).forEach(map => {
                    let tr = el('tr',
                        el('td', map.csgoMap.toLowerCase()),
                        el('td', map.matches),
                        el('td', `${map.wins} (${map.winPercentage}%)`),
                        el('td', map.kdRatio),
                        el('td',));
                    table.appendChild(tr);
                });

                const divContainer = setupExpandableDivWithChevron(statsExpanded, table);

                // Append constructed table to correlated HTML node
                Array.from(teamMemberElements).filter(el => el.querySelector('strong').innerText === stat.nickname)
                    .map(el => {
                        el.parentNode.parentNode.parentNode.firstElementChild.appendChild(divContainer);
                        return el
                    });
            });
        })
    })
}

function getTuscanLink(nickname) {
    return el('a', {
        title: `${nickname} TUSCAN stats`,
        href: `https://tuscan.pro/player/${nickname}`,
        target: '_blank'
    }, 'Tuscan Stats');
}

function queryParam(nicknames) {
    let query = '?nickname=';
    nicknames.forEach(nickname => {
        query += `${nickname},`
    });
    return query.substr(0, query.length - 1)
}
