import {el, setStyle} from 'redom';

run();

function run() {
    let teamMemberElements = document.getElementsByClassName('match-team-member__details__name');
    console.log('run!');

    if (teamMemberElements.length > 0) {
        injectApp(teamMemberElements);
    } else {
        setTimeout(run, 1000);
    }
}

function injectApp(teamMembersElements) {
    let nicknames = [];

    const playerDetailsElements = teamMembersElements;
    for (let i = 0; i < playerDetailsElements.length; i++) {
        const nickname = playerDetailsElements[i].querySelector('strong').innerText;
        nicknames.push(nickname);

        let tuscanLink = getTuscanLink(nickname);
        playerDetailsElements[i].appendChild(tuscanLink);
    }

    let faction1 = nicknames.slice(0, 5);
    let faction2 = nicknames.slice(5);

    console.log(faction1);
    console.log(faction2);

    doFaction(faction1);
    doFaction(faction2);
}

function doFaction(faction) {
    let query = queryParam(faction);
    const url = `http://localhost:8080/faceit/players/details/csgo${query}`;
    let mapStatsList;

    fetch(url).then(data => {
        data.json().then(data => {
            const middleSection = document.getElementsByClassName('match-vs__details match-vs__column-scroll')[0];
            let pickHelperDiv = document.createElement('div');

            middleSection.appendChild(pickHelperDiv);

            mapStatsList = data;
            console.log(mapStatsList);

            let playersMapStats = [];
            mapStatsList.forEach(stats => {
                stats.mapStats.forEach(mS => {
                    playersMapStats.push(mS);
                })
            });

            let maps = new Set();

            playersMapStats.forEach(m => {
                maps.add(m.csgoMap);
            });

            console.log(maps);

            let akumulowanexd = [];
            maps.forEach(m => {

                let x = playersMapStats.filter(el => el.csgoMap === m);

                console.log(x);

                x.map(stats => {
                    stats.accKd = stats.kdRatio * stats.matches;
                    return stats;
                });


                let y = x.reduce((acc, curr) => {
                    console.log(`acc kd ${acc.kdRatio} current kd ${curr.kdRatio} and acc matches ${acc.matches} and curr matches ${curr.matches}`);
                    return {
                        csgoMap: acc.csgoMap,
                        matches: acc.matches + curr.matches,
                        accKd: acc.accKd + curr.accKd,
                        wins: acc.wins + curr.wins
                    };
                });


                y.avgKd = Number((y.accKd / y.matches).toFixed(2));
                y.winRate = Number((y.wins / y.matches * 100).toFixed(2));
                akumulowanexd.push(y);

            });

            console.table(akumulowanexd.sort((a, b) => (a.matches > b.matches) ? -1 : 1));

            // For every player in opponent team
            for (let i = 0; i < faction.length; i++) {
                let table = el('table', {className: "text-sm"});
                setStyle(table, {width: '100%', color: '#777', backgroundColor: '#181818', marginBottom: '10px'});
                table.appendChild(el('tr', el('td', `${faction[i]}`)));
                let tr = el('tr', el('td', 'map'), el('td', 'matches'), el('td', 'wins'), el('td', 'kdRatio'));
                table.appendChild(tr);


                console.log('***************** XDDD ************');
                console.log(faction[i]);
                console.log(mapStatsList.filter(function (el) {
                    console.log('hehe nickname is: ' + el.nickname);
                    return el.nickname === faction[i];
                }));
                console.log('***************** XDDD ************');
                // For every map...
                mapStatsList[i].mapStats.forEach(map => {

                    let tr = el('tr', el('td', map.csgoMap.toLowerCase()), el('td', map.matches), el('td', `${map.wins} (${((map.wins / map.matches) * 100).toFixed(0)}%)`), el('td', map.kdRatio), el('td',));
                    table.appendChild(tr);

                });
                middleSection.appendChild(table);
            }
        })
    })
}

function getTuscanLink(nickname) {
    return el('a', {
        title: `${nickname} TUSCAN stats`,
        href: `https://tuscan.pro/player/${nickname}`,
        target: '_blank'
    }, "Tuscan Stats");
}

function queryParam(nicknames) {
    let query = '?nickname=';
    nicknames.forEach(nickname => {
        query += `${nickname},`
    });
    return query.substr(0, query.length - 2)
}
