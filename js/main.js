$(function () {
    //Bitter Bitch,0.061,60,1979,American Pale Ale (APA),177,12,18th Street Brewery,Gary,IN,midwest

    d3.csv('data/merged_beers3.csv', function (error, data) {
        var style = 'Pale Ale',
            abv = [0, 0.070],
            ibu = [0, 65],
            regions = ['west', 'midwest', 'south', 'northeast'];



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

        var svg = d3.select("#viz")
            .append('svg')
            .attr('width', width)
            .attr('height', height);


        var g = svg.append('g')
            // diameter/2
            .attr('transform', 'translate(' + (diameter / 2) + "," + (diameter / 2) + ')');


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
            // console.log(data);
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

            var root = d3.hierarchy({
                values: nestedData
            }, function (d) {
                return d.values;
            })
                .sort(function (a, b) {
                    return b.value - a.value;
                });

            return root;
            //console.log(root);
        }
        var colorScale = d3.scaleOrdinal().domain(regions).range(d3.schemeCategory10);

        function draw(root) {
            var localRoot = root;
            localRoot.sum(function (d) {
                return +d['abv'];
            });

            var focus = localRoot,
                nodes = pack(localRoot).descendants(),
                view;
            //console.log(pack(root));


            var margin1 = 20;

            //pack(root);
            //what is format though?
            var format = d3.format(",d");

            //var node = g.selectAll('.node')
            //.data(root.leaves());
            // console.log(pack(root).leaves());
            //node == circle?


            //console.log(root);
           // zoomTo([+localRoot.x, +localRoot.y, +localRoot.r * 2 + margin1]);

            var z = diameter / localRoot.r;

            var k = diameter / localRoot.r;
                //console.log(v[2]);
            view = [+localRoot.x, +localRoot.y, +localRoot.r * 2 + margin1];
            var v = view;
            var circle = g.selectAll('circle')
                .data(nodes);
            circle.enter()
                .append('circle')
                .attr('transform', function(d){
                    return "translate(" + d.x + "," + d.y + ")";
                })
                .attr('r', function(d){
                    return d.r;
                })
                .on('click', function (d) { if (focus !== d) zoom(d), d3.event.stopPropagation(); })
                .merge(circle)
                .style('fill', function (d) {
                    if (d.parent !== localRoot) {
                        //console.log(d.data.region)
                        //console.log(d.data);
                        ; return colorScale(d.data.region);
                    } else {
                        return '#F5F5F5';
                    }
                })
                .attr("class", function (d) { return d.parent ? d.children ? "node" : "node node--leaf" : "node node--root"; })
                //.transition()
                   // .duration(1000)
                .attr('transform', function(d){
                    // zoomTo([+localRoot.x, +localRoot.y, +localRoot.r * 2 + margin1]);
                    return "translate(" + (+d.x - localRoot.x)  + "," + (+d.y - localRoot.y) + ")"
                    return 'translate(' + d.x + ',' + d.y + ")";
                })
                .attr('r', function(d){
                    return d.r ;
                });
                

                circle.exit()
                .transition().duration(1000)
                .remove();

            //deja esta linea solo hasta data, despues do text.enter()
            var text = g.selectAll("text")
                .data(nodes);

            text.enter()
                .append("text")
                .merge(text)
                .attr("class", "label")
                .style('fill', '#808080')
                .style('stroke', 'none')
                .attr('transform', function (d) {
                    if (d.parent === localRoot && d.data.key == "midwest") {
                        //console.log(d.x +"," + d.y); 
                    }
                    return 'translate(' + (d.x) + ", " + (d.y) + ")";
                })
                //.transition().duration(1500)
                .style("fill-opacity", function (d) { return d.parent === localRoot ? 1 : 0; })
                .style("display", function (d) { return d.parent === localRoot ? "inline" : "none"; })
                //show this text only on hover!
                .text(function (d) {
                    var val = "";
                    if (d.parent !== root) {
                        val = d.data.name_x + "\n" + "ABV: " + d.data.abv + "\n" + "IBU: " + d.data.ibu;
                    } else {
                        val = d.data.key.charAt(0).toUpperCase() + d.data.key.slice(1);
                    }
                    return val;
                })
                .style('font-size', function (d) {
                    if (d.parent !== localRoot) {
                        return 15 + "px";
                    } else {
                        return 50 + "px";
                    }
                })
                .exit().transition().duration(1000).remove();

            var node = g.selectAll('circle,text');

            //this.text(function(d){
            //  return this.data.name_x;
            //})
            svg.style('background', '#E5FFCC')
                .on('click', function () { zoom(localRoot); });
            // console.log(localRoot);

            console.log(localRoot.x + ", " + localRoot.y + ", " + localRoot.r);
            zoomTo([+localRoot.x, +localRoot.y, +localRoot.r]);

            function zoom(d) {
                var focus0 = focus;
                focus = d;
                console.log(d);
                var transition = d3.transition()
                    .duration(d3.event.altKey ? 7500 : 750)
                    .tween("zoom", function (d) {
                        //console.log(focus.x + "," + focus.y + "," + focus.r);
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
               
                node.attr("transform", function (d) {
                    //console.log(v[0] + "," + v[1]);
                    return "translate(" + (+d.x - v[0]) * k + "," + (+d.y - v[1]) * k + ")"
                    //return "translate(" + (+d.x) * k + "," + (+d.y) * k + ")"
                })
                circle.attr('r', function (d) { return d.r * k; });
            }





            /*  .data(pack(root).leaves())
              .enter()
              .append('g')
              .attr('class', function (d) { return d.children ? "node" : "leaf node"; })
              .attr('transform', function (d) {
                  return 'translate(' + (+d.x) + ', ' + (+d.y) + ")";
              });
    
          node.append('title')
              .text(function (d) { return d.data.name_x + "\n" + d.data.abv; });//format(+d.data.abv);});
    
          node.append('circle')
              .attr('r', function (d) { return d.r; })
              .attr('fill', function (d) {
                  return colorScale(d.data.region);
              })
              .on({
              "mouseover": function (d) {
                  d3.select(this).style("cursor", "pointer"); /*semicolon here*/
            /* },
             "mouseout": function (d) {
                 d3.select(this).style("cursor", "default"); /*and there*/
            //}
            //});

            //node.filter(function (d) { return !d.children; })
            //  .append("text")
            // .attr('dy', '0.3em')
            //.text(function (d) { return d.data.name; });


            /*var results = d3.nest()
                .key(function(d){
                    return d.region
                })
                 .rollup(function (v) {
                    return {
                        count: v.length,
                        ibu: d3.mean(v, function (d) { return +d.ibu;}),
                        abv: d3.mean(v, function (d) { return +d.abv; })
                    };})
                .entries(filtered);
               
            console.log(results);
            var svg = d3.select("#viz")
                .append('svg')
                .attr("width", width)
                .attr("height", height);
    
            var g = svg.append('g')
                .attr('transform', 'translate(' + margin.left + ', ' + margin.top + ")")
                .attr('width', drawWidth)
                .attr('height', drawHeight);
    
            var xAxisContainer = svg.append('g')
                .attr('transform', 'translate(' + margin.left + ", " + (drawHeight + margin.top) + ")")
                .attr('class', 'axis');
    
            var yAxisContainer = svg.append('g')
                .attr('transform', 'translate(' + margin.left + ", " + margin.top + ")")
                .attr('class', 'axis');
    
            var xAxisLabel = svg.append('text')
                .attr('transform', 'translate(' + (margin.left + drawWidth / 2) + ',' + (drawHeight + margin.top + 50) + ')')
                .attr('class', 'title');
    
            var yAxisLabel = svg.append('text')
                .attr('transform', 'translate(' + (margin.left - 55) + ',' + ((margin.top + drawHeight / 2) + 50) + ') rotate(-90)')
                .attr('class', 'title');
    
            var xScale = d3.scaleBand().range([0, drawWidth]).domain(regions);
    
            console.log(d3.values(results));
            var yMax = d3.max(results.values, function(array){
                console.log(array);
                return d3.max(array.count);
            })
            var yMax = d3.max(results, function (array) { return d3.max(array.values); });
    
            var yScale = d3.scaleLinear().range([drawHeight, 0]).domain([0, yMax.abv]);
    
            var generateXAxis = d3.axisBottom(xScale);
            var generateYAxis = d3.axisLeft(yScale).tickFormat(d3.format('.2s'));
            xAxisContainer.call(generateXAxis);
            yAxisContainer.call(generateYAxis);
            xAxisLabel.text('Regions in the U.S');
            yAxisLabel.text('Percentage of ABV');
    
    
            var bars = d3.selectAll('rect').data(results, function(d){
                return d.key;
            })
    
            bars.enter().append('rect')
            .attr('y', function(d){
                return drawHeight;
            })
            .attr('x', function(d){
                return xScale(d.values.region);
            })
            .attr('height', 0)
            .attr('class', 'bar')
            .merge(bars);
            //.attr('y')*/
            //var defaultData = filterData();
            //draw(defaultData);
        }

        function updateVis() {

            var root1 = filterData();
            // d3.select('g').transition().duration(1000).remove();
            // if(== 0){
            //    d3.select('#viz').append('svg').attr('fill', 'blue').append('text').text("NO DATA AVAILABLE!");
            //} else {
            draw(root1);
            //}
            //d3.selectAll('.node').exit().transition().duration(1000).remove();
            //d3.selectAll('.title').exit().transition().duration(1000).remove();

        }

        var x = filterData();
        draw(x);
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


        /* $('#abv').change(function () {
             var option = $(this).find('option:selected');
             abv = option.text();
             console.log(style + ", " + abv + ", " + ibu);
         });
 
         $('#ibu').change(function () {
             var option = $(this).find('option:selected');
             ibu = option.text();
             console.log(style + ", " + abv + ", " + ibu);
         });
 */
        //console.log(style + ", " + abv + ", " + ibu);


    });


});