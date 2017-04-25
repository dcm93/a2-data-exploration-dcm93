$(function () {
    //Bitter Bitch,0.061,60,1979,American Pale Ale (APA),177,12,18th Street Brewery,Gary,IN,midwest
    $("#rationale").hide();
    $('#show').on('click', function () {
        $("#rationale").toggle();
    });
    $('#hide').on('click', function () {
        $('#rationale').toggle();
        var offset = $("header").offset();
        $("html,body").animate({
            scrollTop: offset.top,
            scrollLeft: offset.left
        });
    });
    d3.csv('data/merged_beers3.csv', function (error, data) {
        var style = 'Pale Ale',
            abv = [0, 0.070],
            ibu = [0, 65],
            regions = ['West', 'Midwest', 'South', 'Northeast'];

        var focus;
        var nodes;
        var view;
        var svg;
        var g;
        var margin1;
        var colorScale;

        var margin = {
            top: 50,
            right: 50,
            left: 70,
            bottom: 100
        },
            width = 960,
            height = 960,
            diameter = width,
            drawWidth = width - margin.left - margin.right,
            drawHeight = height - margin.top - margin.bottom;

        function assignRangeAbv(tag) {
            if (tag.includes('Not Detectable')) {
                abv[0] = 0;
                abv[1] = 0.045;
            } else if (tag.includes('Mild')) {
                abv[0] = 0.046;
                abv[1] = 0.060;
            } else if (tag.includes('Noticeable')) {
                abv[0] = 0.601;
                abv[1] = 0.125;
            } else {
                abv[0] = 0.125;
                abv[1] = 1.00;
            }
        }

        function assignRangeIbu(tag) {
            if (tag.includes('Not Hoppy')) {
                ibu[0] = 0;
                ibu[1] = 25;
            } else if (tag.includes('Moderately Hoppy')) {
                ibu[0] = 26;
                ibu[1] = 50;
            } else if (tag.includes('Extremely Hoppy')) {
                ibu[0] = 51;
                ibu[1] = 75;
            } else {
                ibu[0] = 76;
                ibu[1] = 100;
            }
        }

        var pack = d3.pack()
            .size([(diameter - 20), (diameter - 20)])
            //.value(function(d) { return d.abv;})
            .padding(2);

        function filterData() {
            var filtered = data.filter(function (beer) {
                if (+beer.abv >= abv[0] && +beer.abv <= abv[1] && +beer.ibu >= ibu[0] && +beer.ibu <= ibu[1] && beer.style.includes(style)) {
                    return beer;
                }
            });
            var nestedData = d3.nest()
                .key(function (d) {
                    return d.region;
                })
                .entries(filtered);

            root = d3.hierarchy({
                values: nestedData
            }, function (d) {
                return d.values;
            })
                .sort(function (a, b) {
                    return b.value - a.value;
                });

            root.sum(function (d) {
                return +d['abv'];
            });
            //console.log(root);

            focus = root;
            nodes = pack(root).descendants();
        }

        function setUpLayout() {
            if (!svg) {
                svg = d3.select("#viz")
                    .append('svg')
                    .attr('width', width)
                    .attr('height', height);
            }


            margin1 = 20;
            if (!g) {
                g = svg.append('g')
                    .attr('transform', 'translate(' + (diameter / 2) + "," + (diameter / 2) + ')');
            }

            //pack(root);
            //what is format though?
            format = d3.format(",d");




            colorScale = d3.scaleOrdinal().domain(regions).range(['#FF8000', '#32CD32', '#FFFF00', '#0080FF']);
        }

        //console.log(pack(root));
        function draw() {

            //var node = g.selectAll('.node')
            //.data(root.leaves());
            // console.log(pack(root).leaves());
            //node == circle?


            //console.log(root);

            var circle = g.selectAll('circle')
                .data(nodes)
                .enter()
                .append('circle')
                .attr("class", function (d) { return d.parent ? d.children ? "node" : "node node--leaf" : "node node--root"; })
                .style('fill', function (d) {
                    if (d.parent !== root) {
                        //console.log(d.data.region)
                        //console.log(d.data);
                        ; return colorScale(d.data.region);
                    } else {
                        return '#F5F5F5';
                    }
                })
                .on('click', function (d) { if (focus !== d) zoom(d), d3.event.stopPropagation(); });

            circle.exit(function (d) {
                console.log(d);
            }).remove(function (d) {
                console.log(d);
            });
            //deja esta linea solo hasta data, despues do text.enter()
            var text = g.selectAll("text")
                .data(nodes);

            text.enter()
                .append("text")
                .merge(text)
                .attr("class", "label")
                .style('fill', '#000000')
                .style("display", function (d) { return d.parent === root ? "inline" : "none"; })
                .each(function (d) {
                    var val = "";
                    if (d.parent !== root) {
                        console.log(d.y);
                        var element = d3.select(this);
                        if (d.data.name_x != undefined && d.data.name_x.length > d.r / 1.8) {
                            element.append('tspan').text(d.data.name_x.slice(0, d.data.name_x.indexOf(' '))).attr('dy', -20).append('tspan').text(d.data.name_x.slice(d.data.name_x.indexOf(' ') + 1)).attr('dy', '1.05em').attr('x', 7);
                        } else {
                            element.append('tspan').text(d.data.name_x)
                        }
                        element.append('tspan').text("ABV: " + d.data.abv).attr('dy', '1.05em').attr('x', 9)
                            .append('tspan').text("IBU: " + d.data.ibu).attr('dy', '1.05em').attr('x', 2);

                    } else {
                        d3.select(this).text(d.data.key.charAt(0).toUpperCase() + d.data.key.slice(1));
                    }
                })

                .style('font-size', function (d) {
                    if (d.parent !== root) {
                        return 15 + "px";
                    } else {
                        return 50 + "px";
                    }
                });

            text.exit().remove();
            //.exit().remove();
            var node = g.selectAll('circle,text');

            //this.text(function(d){
            //  return this.data.name_x;
            //})
            svg.style('background', '#E5FFCC')
                .on('click', function () { zoom(root); });
            //console.log(root);

            zoomTo([+root.x, +root.y, +root.r * 2 + margin1]);

            function zoom(d) {
                var focus0 = focus;
                focus = d;
                var transition = d3.transition()
                    .duration(d3.event.altKey ? 7500 : 750)
                    .tween("zoom", function (d) {
                        var i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2 + margin1]);
                        return function (t) {
                            zoomTo(i(t));
                        };
                    });

                transition.selectAll("text")
                    .filter(function (d) { return d.parent === focus || this.style.display === 'inline'; })
                    .style('fill-opacity', function (d) { return d.parent === focus ? 1 : 0; })
                    .on('start', function (d) { if (d.parent === focus) this.style.display = 'inline'; })
                    .on("end", function (d) { if (d.parent !== focus) this.style.display = "none"; });
            }

            function zoomTo(v) {
                var k = diameter / v[2];
                view = v;
                node.attr("transform", function (d) {
                    return "translate(" + (+d.x - v[0]) * k + "," + (+d.y - v[1]) * k + ")"
                })
                circle.attr('r', function (d) { return d.r * k; });
            }
        }
        filterData();
        setUpLayout();
        draw();
        function updateVis() {
            filterData();
            //setUpLayout();
            //console.log(nodes);
            draw();
        }
        //filterData();

        $('select').change(function () {
            var selType = $(this).attr('name');
            var option = $(this).find('option:selected').text();
            if (selType === 'style') {
                style = option;
            } else if (selType === 'abv') {
                assignRangeAbv(option);
            } else {
                assignRangeIbu(option);
            }
            updateVis();
            console.log(style + ", " + abv + ", " + ibu);
        });
    });
});
