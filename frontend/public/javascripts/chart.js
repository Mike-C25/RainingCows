$(document).ready(function() {

   var margin = {
            top: 20,
            right: 80,
            bottom: 30,
            left: 50
        },
        width = 1200 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    var parseDate = d3.time.format("%Y%m").parse;
    var parseDateComm = d3.time.format("%Y-%m-%d").parse;

    var x = d3.time.scale()
        .range([0, width]);

    var y = d3.scale.linear()
        .range([height, 0]);

    var y2 = d3.scale.linear()
        .range([height, 0]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left");

    var y2Axis = d3.svg.axis()
        .scale(y2)
        .orient("right");

    var color = d3.scale.category20();

    var line = d3.svg.line()
        .interpolate("basis")
        .x(function(d) {
            return x(d.date);
        })
        .y(function(d) {
            return y(d.temperature);
        });

    var minTempLine = d3.svg.line()
        .interpolate("basis")
        .x(function(d) {
            return x(d.date);
        })
        .y(function(d) {
            return y(d.MMNT);
        });

    var maxTempLine = d3.svg.line()
        .interpolate("basis")
        .x(function(d) {
            return x(d.date);
        })
        .y(function(d) {
            return y(d.MMXT);
        });

    var avgTempLine = d3.svg.line()
        .interpolate("basis")
        .x(function(d) {
            return x(d.date);
        })
        .y(function(d) {
            return y(d.MNTM);
        });

    var commLine = d3.svg.line()
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

    var zoom = d3.behavior.zoom()
        .on("zoom", draw);

    var svg = d3.select(".chart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    d3.csv("/data/continental.csv", type, function(error, data) {
        if (error) throw error;

        var cornAvgMonth = [];

        color.domain(d3.keys(data[0]).filter(function(key) {
            return key !== "date";
        }));

        data.forEach(function(d) {
            d.date = parseDate(d.YEAR + d.MONTH);
        });

        x.domain(d3.extent(data, function(d) {
            return d.date;
        }));

        zoom.x(x);

        y.domain([
            d3.min(data, function(d) {
                return d.MMNT;
            }),
            d3.max(data, function(d) {
                return d.MMXT;
            })
        ]);

        // var months = color.domain().map(function(name) {
        //     return {
        //         name: name,
        //         values: data.map(function(d) {
        //         	console.log(d);
        //             return {
        //                 date: d.date,
        //                 temperature: +d[name]
        //             };
        //         })
        //     };
        // });

        // var months = data.map(function(d) {
        // 	return {
        // 		month: +d.MONTH,
        // 		values: +d.MMXT
        // 	}
        // }).reduce(function(a, b, c, d) {
        // 	console.log(arguments);
        // })

        var months = [];

        for (var i=0; i<data.length; i++) {
        	var m = parseInt(data[i]['MONTH']) - 1;

        	months[m] = months[m] || {};

        	if (!months[m].name) {
        		months[m].name = data[i]['MONTH'];
        		months[m].values = [];
        	}

        	months[m].values.push({
	            date: parseDate(data[i]['YEAR'] + data[i]['MONTH']),
        		temperature: +data[i]['MMNT']
        	});
        }

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
            .datum(data)
            .attr("class", "line min")
            .attr("d", minTempLine);

        svg.append("path")
            .datum(data)
            .attr("class", "line max")
            .attr("d", maxTempLine);

        svg.append("path")
            .datum(data)
            .attr("class", "line avg")
            .attr("d", avgTempLine);

        var month = svg.selectAll(".month")
            .data(months)
            .enter().append("g")
            .attr("class", "month");

        month.append("path")
            .attr("class", "line")
            .attr("d", function(d) {
                return line(d.values);
            })
            .style("stroke", function(d) {
                return color(d.name);
            });

        var focus = svg.append("g").attr("class", "focus").style("display", "none");

        focus.append("circle").attr("class", "min").attr("r", 4.5);
        focus.append("circle").attr("class", "max").attr("r", 4.5);
        focus.append("circle").attr("class", "avg").attr("r", 4.5);
        focus.append("circle").attr("class", "comm").attr("r", 4.5);

        focus.append("text").attr("class", "min").attr("x", 9).attr("dy", ".35em");
        focus.append("text").attr("class", "max").attr("x", 9).attr("dy", ".35em");
        focus.append("text").attr("class", "avg").attr("x", 9).attr("dy", ".35em");
        focus.append("text").attr("class", "comm").attr("x", 9).attr("dy", ".35em");

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

        function mousemove() {
            var x0 = x.invert(d3.mouse(this)[0]),
                i = bisectDate(data, x0, 1),
                d0 = data[i - 1],
                d1 = data[i],
                d = x0 - d0.date > d1.date - x0 ? d1 : d0;

            // focus.selectAll(".min").attr("transform", "translate(" + x(d.date) + "," + y(d.MMNT) + ")");
            // focus.selectAll(".max").attr("transform", "translate(" + x(d.date) + "," + y(d.MMXT) + ")");
            // focus.selectAll(".avg").attr("transform", "translate(" + x(d.date) + "," + y(d.MNTM) + ")");

            // focus.select("text.min").text(formatValue(d.MMNT));
            // focus.select("text.max").text(formatValue(d.MMXT));
            // focus.select("text.avg").text(formatValue(d.MNTM));

            if (cornAvgMonth.length > 0) {
                var x0 = x.invert(d3.mouse(this)[0]),
                    i = bisectDate(cornAvgMonth, x0, 1),
                    d0 = cornAvgMonth[i - 1],
                    d1 = cornAvgMonth[i];
                d = x0 - d0.date > d1.date - x0 ? d1 : d0;

                // console.log(d);

                focus.selectAll(".comm").attr("transform", "translate(" + x(d.date) + "," + y2(d.Open) + ")");
                focus.select("text.comm").text(formatValue(d.Open));
            }

        }

        draw();


    
        d3.json("/data/corn.json", function(d) {

            var corn = d.dataset.data;

            corn.forEach(function(d) {
                d.date = parseDateComm(d[0]);
            })

            var cornAvg = {};

            corn.forEach(function(d) {

                var year = d.date.getFullYear();
                var month = d.date.getMonth();

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

            y2.domain([
                d3.min(cornAvgMonth, function(d) {
                    return d["Open"];
                }),
                d3.max(cornAvgMonth, function(d) {
                    return d["Open"];
                })
            ]);

            svg.append("path")
                .datum(cornAvgMonth)
                .attr("class", "line comm")
                .attr("stroke-width", "2")
                .attr("d", commLine);

            draw();
        });
    });

    function draw() {
        svg.select("g.x.axis").call(xAxis);
        svg.select("g.y.axis").call(yAxis);
        svg.select("g.y2.axis").call(y2Axis);

		svg.selectAll(".month path")
		            .attr("d", function(d) {
		                return line(d.values);
		            })
		            .style("stroke", function(d) {
		                return color(d.name);
		            });

        svg.select("path.line.min").attr("d", minTempLine);
        svg.select("path.line.max").attr("d", maxTempLine);
        svg.select("path.line.avg").attr("d", avgTempLine);
        svg.select("path.line.comm").attr("d", commLine);
    }

    function type(d) {
        d.MMNT = +(d.MMNT / 10 * 9 / 5 + 32);
        d.MMXT = +(d.MMXT / 10 * 9 / 5 + 32);
        d.MNTM = +(d.MNTM / 10 * 9 / 5 + 32);

        return d;
    }
});
