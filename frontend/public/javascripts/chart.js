function scaleToFit() {
    var svgd = d3.select(".chart").transition();

    svgd.select("g.x.axis").call(xAxis);
    svgd.select("g.y.axis").call(yAxis);
    svgd.select("g.y2.axis").call(y2Axis);

    if (typeof weatherData != 'undefined') {

        svgd.select(".line.min")
            .duration(750)
            .attr("d", minTempLine);

        svgd.select(".line.max")
            .duration(750)
            .attr("d", maxTempLine);

        svgd.select(".line.avg")
            .duration(750)
            .attr("d", avgTempLine);

        for (var m in monthAbbr) {
            svgd.select(".line." + monthAbbr[m])
                .duration(750)
                .attr("d", monthTempLine)
        }
    }

    if (typeof commData != 'undefined' && commData.length > 0) {

        svgd.select(".line.comm")
            .duration(750)
            .attr("d", commLine);
    }
}

function processWeatherData(data) {

    window.weatherData = data;

    data.forEach(function(d) {
        d.mmnt = +(d.mmnt / 10 * 9 / 5 + 32);
        d.mmxt = +(d.mmxt / 10 * 9 / 5 + 32);
        d.mntm = +(d.mntm / 10 * 9 / 5 + 32);
        d.date = parseDate(d.year + "-" + d.month);
    });

    x.domain(d3.extent(data, function(d) {
        return d.date;
    }));

    zoom.x(x)

    y.domain([
        d3.min(data, function(d) {
            return d.mmnt;
        }),
        d3.max(data, function(d) {
            return d.mmxt;
        })
    ]);


    var months = [];

    for (var i = 0; i < data.length; i++) {
        var m = parseInt(data[i]['month']) - 1;

        months[m] = months[m] || {};

        if (!months[m].name) {
            months[m].name = data[i]['month'];
            months[m].values = [];
        }

        months[m].values.push({
            date: parseDate(data[i]['year'] + "-" + data[i]['month']),
            temperature: data[i]['mntm']
        });
    }

    svg.select(".line.min").datum(data);
    svg.select(".line.max").datum(data);
    svg.select(".line.avg").datum(data);

    for (var m in monthAbbr) {
        svg.select(".line." + monthAbbr[m]).datum(months[m].values);
    }

    scaleToFit();
}

function handleWeatherRow() {
    var input = $(this);
    var type = input.data('type');

    if (input.is(':checked')) {

        var url = '/api/weather';

        if (type == 'state') {
            url += '?states=' + input.data('id');
        }
        else {
            url += '?preset=' + input.data('id');
        }

        d3.json(url, function(response) {

            if (response.success != true) {
                alert(response.message);
                console.error(response);
            }
            else {
                processWeatherData(response.data);
            }
        });
    }
}

function processCommodityData(d) {

    var corn = d.dataset.data;

    corn.forEach(function(d) {
        d.date = parseDateComm(d[0]);
    })

    var cornAvg = {};

    corn.forEach(function(d) {

        var year = d.date.getFullYear();
        var month = d.date.getMonth();

        if (year < 1992)
            return;

        cornAvg[year] = cornAvg[year] || {};
        cornAvg[year][month] = cornAvg[year][month] || {};

        var monthAvg = cornAvg[year][month];

        if (!monthAvg["Open"]) {
            monthAvg["Open"] = 0;
            monthAvg["High"] = 0;
            monthAvg["Low"] = 0;
            monthAvg["Settle"] = 0;
            monthAvg["Volume"] = 0;
            monthAvg["PDOI"] = 0;
            monthAvg["Count"] = 1;
            monthAvg["date"] = d.date;
        }

        monthAvg["Open"] += d[1];
        monthAvg["High"] += d[2];
        monthAvg["Low"] += d[3];
        monthAvg["Settle"] += d[4];
        monthAvg["Volume"] += d[5];
        monthAvg["PDOI"] += d[6];
        monthAvg["Count"] += 1;
    })

    var cornAvgMonth = window.commData = [];

    for (var y in cornAvg) {
        for (var m in cornAvg[y]) {
            var monthAvg = cornAvg[y][m];

            monthAvg["Open"] /= monthAvg["Count"];
            monthAvg["High"] /= monthAvg["Count"];
            monthAvg["Low"] /= monthAvg["Count"];
            monthAvg["Settle"] /= monthAvg["Count"];
            monthAvg["Volume"] /= monthAvg["Count"];
            monthAvg["PDOI"] /= monthAvg["Count"];

            cornAvgMonth.push(monthAvg);
        }
    }

    x.domain(d3.extent(cornAvgMonth, function(d) {
        return d.date;
    }));

    zoom.x(x)

    y2.domain([
        d3.min(cornAvgMonth, function(d) {
            return d["Open"];
        }),
        d3.max(cornAvgMonth, function(d) {
            return d["Open"];
        })
    ]);

    svg.select(".line.comm").datum(cornAvgMonth);

    scaleToFit();
}

function handleCommodityRow() {
    var input = $(this);
    var path = input.data('path');

    if (input.is(':checked')) {

        d3.json(path, function(response) {

            if (!response) {
                alert('Unable to load dataset');
            }
            else {
                processCommodityData(response);
            }
        });
    }
}

function populateTables() {

    var commTable = $('.commoditiesTable');
    var weatherTable = $('.weatherTable');

    var commodityRow = $('<tr><td><input type="radio" name="commodity"/><p></p></td></tr>');

    for (var i in commodities) {
        var comm = commodities[i];

        commTable.append(
            commodityRow.clone()
            .find('p').html(comm.name).end()
            .find('input')
            .attr('data-path', comm.path)
            .on('change', handleCommodityRow).end()
        );
    }

    var weatherRow = $('<tr><td><div class="indent"></div><input type="radio" name="weather"/><p></p></td></tr>');

    weatherTable.append(
        weatherRow.clone()
        .find('p').html('Entire US').end()
        .find('input')
        .attr('data-id', 'us')
        .attr('data-type', 'preset')
        .on('change', handleWeatherRow).end()
    );

    weatherTable.append(
        weatherRow.clone()
        .find('p').html('Continental US').end()
        .find('input')
        .attr('data-id', 'conus')
        .attr('data-type', 'preset')
        .on('change', handleWeatherRow).end()
    );

    for (var r in regions) {

        var region = regions[r];

        weatherTable.append(
            weatherRow.clone()
            .find('p').html(region.name).end()
            .find('input')
            .attr('data-id', region.abbr)
            .attr('data-type', 'region')
            .on('change', handleWeatherRow).end()
        );

        for (var s in region.states) {

            var state = region.states[s];

            weatherTable.append(
                weatherRow.clone()
                .find('p').html(state.name).end()
                .find('.indent').css('width', '2em').end()
                .find('input')
                .attr('data-id', state.abbr)
                .attr('data-type', 'state')
                .on('change', handleWeatherRow).end()
            );
        }
    }
}

function setupChart() {
    var chart = {};

    $('#maxTemp').on('change', function() {
        if ($(this).is(':checked')) {
            $('.line.max, .focus .max').show();
        }
        else {
            $('.line.max, .focus .max').hide();
        }
    });

    $('#minTemp').on('change', function() {
        if ($(this).is(':checked')) {
            $('.line.min, .focus .min').show();
        }
        else {
            $('.line.min, .focus .min').hide();
        }
    });

    $('#avgTemp').on('change', function() {
        if ($(this).is(':checked')) {
            $('.line.avg, .focus .avg').show();
        }
        else {
            $('.line.avg, .focus .avg').hide();
        }
    });

    $('#monthTrend').on('change', function() {
        if ($(this).is(':checked')) {
            $('.line.month').show();
        }
        else {
            $('.line.month').hide();
        }
    });

    window.chart = chart;
}

$(document).ready(function() {

    populateTables();
    setupChart();

    var margin = {
            top: 20,
            right: 80,
            bottom: 30,
            left: 50
        },
        width = 1200 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    window.parseDate = d3.time.format("%Y-%m").parse;
    window.parseDateComm = d3.time.format("%Y-%m-%d").parse;

    window.x = d3.time.scale()
        .range([0, width]);

    window.y = d3.scale.linear()
        .range([height, 0]);

    window.y2 = d3.scale.linear()
        .range([height, 0]);

    window.xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    window.yAxis = d3.svg.axis()
        .scale(y)
        .orient("left");

    window.y2Axis = d3.svg.axis()
        .scale(y2)
        .orient("right");

    window.color = d3.scale.category20().domain([0, 11]);

    window.minTempLine = d3.svg.line()
        .interpolate("basis")
        .x(function(d) {
            return x(d.date);
        })
        .y(function(d) {
            return y(d.mmnt);
        });

    window.maxTempLine = d3.svg.line()
        .interpolate("basis")
        .x(function(d) {
            return x(d.date);
        })
        .y(function(d) {
            return y(d.mmxt);
        });

    window.avgTempLine = d3.svg.line()
        .interpolate("basis")
        .x(function(d) {
            return x(d.date);
        })
        .y(function(d) {
            return y(d.mntm);
        });

    window.monthTempLine = d3.svg.line()
        .interpolate("basis")
        .x(function(d) {
            return x(d.date);
        })
        .y(function(d) {
            return y(d.temperature);
        });

    window.commLine = d3.svg.line()
        .interpolate("basis")
        .x(function(d) {
            return x(d.date);
        })
        .y(function(d) {
            return y2(d["Open"]);
        });

    var bisectDate = d3.bisector(function(d) {
        return d.date;
    }).left;

    var formatValue = d3.format(",.2f");

    window.zoom = d3.behavior.zoom();
    window.zoom.on("zoom", draw);

    window.svg = d3.select(".chart").append("svg")
        // .attr("width", width + margin.left + margin.right)
        // .attr("height", height + margin.top + margin.bottom)
        .attr('width', '100%')
        .attr('viewBox', '0 0 ' + ("width", width + margin.left + margin.right) + ' ' + ("height", height + margin.top + margin.bottom))
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Temperature (ºF)");

    svg.append("g")
        .attr("class", "y2 axis")
        .attr("transform", "translate(" + width + ",0)")
        .call(y2Axis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", "-1.3em")
        .style("text-anchor", "end")
        .text("Value ($)");

    svg.append("path")
        .attr("class", "line min")

    svg.append("path")
        .attr("class", "line max")

    svg.append("path")
        .attr("class", "line avg")

    for (var m in monthAbbr) {
        svg.append("path")
            .attr("class", "line month " + monthAbbr[m])
            .attr("stroke-width", "15")
            .style("stroke", function(d) {
                return color(m);
            })
    }

    svg.append("path")
        .attr("class", "line comm")
        .attr("stroke-width", "20")

    svg.append("rect")
        .attr("class", "overlay")
        .attr("width", width)
        .attr("height", height)
        .on("mouseover", function() {
            focus.style("display", null);
        })
        .on("mouseout", function() {
            focus.style("display", "none");
        })
        .on("mousemove", mousemove)
        .call(zoom);

    var focus = svg.append("g").attr("class", "focus").style("display", "none");

    focus.append("circle").attr("class", "min").attr("r", 4.5);
    focus.append("circle").attr("class", "max").attr("r", 4.5);
    focus.append("circle").attr("class", "avg").attr("r", 4.5);
    focus.append("circle").attr("class", "comm").attr("r", 4.5);

    focus.append("text").attr("class", "min").attr("x", 9).attr("dy", ".35em");
    focus.append("text").attr("class", "max").attr("x", 9).attr("dy", ".35em");
    focus.append("text").attr("class", "avg").attr("x", 9).attr("dy", ".35em");
    focus.append("text").attr("class", "comm").attr("x", 9).attr("dy", ".35em");


    function mousemove() {
        if (typeof weatherData != 'undefined') {
            var x0 = x.invert(d3.mouse(this)[0]),
                i = bisectDate(weatherData, x0, 1),
                d0 = weatherData[i - 1],
                d1 = weatherData[i],
                d = x0 - d0.date > d1.date - x0 ? d1 : d0;

            focus.selectAll(".min").attr("transform", "translate(" + x(d.date) + "," + y(d.mmnt) + ")");
            focus.selectAll(".max").attr("transform", "translate(" + x(d.date) + "," + y(d.mmxt) + ")");
            focus.selectAll(".avg").attr("transform", "translate(" + x(d.date) + "," + y(d.mntm) + ")");

            focus.select("text.min").text(formatValue(d.mmnt));
            focus.select("text.max").text(formatValue(d.mmxt));
            focus.select("text.avg").text(formatValue(d.mntm));
        }

        if (typeof commData != 'undefined' && commData.length > 0) {
            var x0 = x.invert(d3.mouse(this)[0]),
                i = bisectDate(commData, x0, 1),
                d0 = commData[i - 1],
                d1 = commData[i];
            d = x0 - d0.date > d1.date - x0 ? d1 : d0;

            focus.selectAll(".comm").attr("transform", "translate(" + x(d.date) + "," + y2(d.Open) + ")");
            focus.select("text.comm").text(formatValue(d.Open));
        }

    }

    function draw() {

        svg.select("g.x.axis").call(xAxis);
        svg.select("g.y.axis").call(yAxis);
        svg.select("g.y2.axis").call(y2Axis);

        if (typeof weatherData != 'undefined') {

            for (var m in monthAbbr) {
                svg.select(".line." + monthAbbr[m]).attr("d", monthTempLine)
            }

            svg.select("path.line.min").attr("d", minTempLine);
            svg.select("path.line.max").attr("d", maxTempLine);
            svg.select("path.line.avg").attr("d", avgTempLine);
        }

        if (typeof commData != 'undefined' && commData.length > 0) {
            svg.select("path.line.comm").attr("d", commLine);
        }
    }
});

var monthAbbr = [
    'jan',
    'feb',
    'mar',
    'apr',
    'may',
    'jun',
    'jul',
    'aug',
    'sep',
    'oct',
    'nov',
    'dec'
];

var regions = [{
    'name': 'New England',
    'abbr': 'ne',
    'states': [{
        'name': "Connecticut",
        'abbr': 'ct'
    }, {
        'name': "Maine",
        'abbr': 'me'
    }, {
        'name': "Massachusetts",
        'abbr': 'ma'
    }, {
        'name': "New Hampshire",
        'abbr': 'nh'
    }, {
        'name': "Rhode Island",
        'abbr': 'ri'
    }, {
        'name': "Vermont",
        'abbr': 'vt'
    }]
}, {
    'name': 'Mid Atlantic',
    'abbr': 'ma',
    'states': [{
        'name': "Delaware",
        'abbr': 'de'
    }, {
        'name': "Maryland",
        'abbr': 'md'
    }, {
        'name': "New Jersey",
        'abbr': 'nj'
    }, {
        'name': "New York",
        'abbr': 'ny'
    }, {
        'name': "Pennsylvania",
        'abbr': 'pa'
    }]
}, {
    'name': 'South',
    'abbr': 's',
    'states': [{
        'name': "Alabama",
        'abbr': 'al'
    }, {
        'name': "Arkansas",
        'abbr': 'ar'
    }, {
        'name': "Florida",
        'abbr': 'fl'
    }, {
        'name': "Georgia",
        'abbr': 'ga'
    }, {
        'name': "Kentucky",
        'abbr': 'ky'
    }, {
        'name': "Louisiana",
        'abbr': 'la'
    }, {
        'name': "Mississippi",
        'abbr': 'ms'
    }, {
        'name': "Missouri",
        'abbr': 'mo'
    }, {
        'name': "North Carolina",
        'abbr': 'nc'
    }, {
        'name': "South Carolina",
        'abbr': 'sc'
    }, {
        'name': "Tennessee",
        'abbr': 'tn'
    }, {
        'name': "Virginia",
        'abbr': 'va'
    }, {
        'name': "West Virginia",
        'abbr': 'wv'
    }]
}, {
    'name': 'Midwest',
    'abbr': 's',
    'states': [{
        'name': "Illinois",
        'abbr': 'il'
    }, {
        'name': "Indiana",
        'abbr': 'in'
    }, {
        'name': "Iowa",
        'abbr': 'ia'
    }, {
        'name': "Kansas",
        'abbr': 'ks'
    }, {
        'name': "Michigan",
        'abbr': 'mi'
    }, {
        'name': "Minnesota",
        'abbr': 'mn'
    }, {
        'name': "Nebraska",
        'abbr': 'ne'
    }, {
        'name': "North Dakota",
        'abbr': 'nd'
    }, {
        'name': "Ohio",
        'abbr': 'oh'
    }, {
        'name': "South Dakota",
        'abbr': 'sd'
    }, {
        'name': "Wisconsin",
        'abbr': 'wi'
    }]
}, {
    'name': 'Southwest',
    'abbr': 'sw',
    'states': [{
        'name': "Arizona",
        'abbr': 'az'
    }, {
        'name': "New Mexico",
        'abbr': 'nm'
    }, {
        'name': "Oklahoma",
        'abbr': 'ok'
    }, {
        'name': "Texas",
        'abbr': 'tx'
    }]
}, {
    'name': "West",
    'abbr': 'w',
    'states': [{
        'name': "Alaska",
        'abbr': 'ak'
    }, {
        'name': "California",
        'abbr': 'ca'
    }, {
        'name': "Colorado",
        'abbr': 'co'
    }, {
        'name': "Idaho",
        'abbr': 'id'
    }, {
        'name': "Montana",
        'abbr': 'mt'
    }, {
        'name': "Nevada",
        'abbr': 'nv'
    }, {
        'name': "Oregon",
        'abbr': 'or'
    }, {
        'name': "Utah",
        'abbr': 'ut'
    }, {
        'name': "Washington",
        'abbr': 'wa'
    }, {
        'name': "Wyoming",
        'abbr': 'wy'
    }]
}];
var commodities = [{
    name: "Corn",
    startYear: 1959,
    endYear: 2016,
    path: "/data/corn.json"
}, {
    name: "Crude Oil",
    startYear: 1983,
    endYear: 2016,
    path: "/data/crudeoil.json"
}, {
    name: "Ethanol",
    startYear: 2011,
    endYear: 2016,
    path: "/data/ethanol.json"
}, {
    name: "Gasoline",
    startYear: 2006,
    endYear: 2016,
    path: "/data/gasoline.json"
}, {
    name: "Gold",
    startYear: 1975,
    endYear: 2016,
    path: "/data/gold.json"
}, {
    name: "Hogs",
    startYear: 1970,
    endYear: 2016,
    path: "/data/hogs.json"
}, {
    name: "Live Cattle",
    startYear: 1965,
    endYear: 2016,
    path: "/data/livecattle.json"
}, {
    name: "Natural Gas",
    startYear: 1990,
    endYear: 2016,
    path: "/data/naturalgas.json"
}, {
    name: "Soy",
    startYear: 1970,
    endYear: 2016,
    path: "/data/soy.json"
}, {
    name: "Wheat",
    startYear: 1959,
    endYear: 2016,
    path: "/data/wheat.json"
}]
