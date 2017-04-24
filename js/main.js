$(function () {
    //Bitter Bitch,0.061,60,1979,American Pale Ale (APA),177,12,18th Street Brewery,Gary,IN,midwest

    d3.csv('data/merged_beers3.csv', function (error, data) {
        var style = 'Pale Ale',
            abv = [0, 0.070],
            ibu = [0, 65],
            regions = ['West', 'Midwest', 'South', 'Northeast'];

            var root;

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
            console.log(root);
        }

        filterData();
        var colorScale = d3.scaleOrdinal().domain(regions).range(['#FF8000', '#32CD32', '#FFFF00', '#0080FF']);



            //console.log(pack(root));

            var svg = d3.select("#viz")
                .append('svg')
                .attr('width', width)
                .attr('height', height);

            var margin1 = 20;

            var g = svg.append('g')
                .attr('transform', 'translate(' + (diameter / 2) + "," + (diameter / 2) + ')');
            //pack(root);
            //what is format though?
            var format = d3.format(",d");

            //var node = g.selectAll('.node')
            //.data(root.leaves());
            // console.log(pack(root).leaves());
            //node == circle?

            var focus = root,
                nodes = pack(root).descendants(),
                view;
            //console.log(root);

            var circle = g.selectAll('circle')
                .data(nodes)
                .enter()
                .append('circle')
                .attr("class", function (d) { return d.parent ? d.children ? "node" : "node node--leaf" : "node node--root"; })
                .attr('fill', function (d) { return colorScale(d.data.region); })
                .on('click', function (d) { if (focus !== d) zoom(d), d3.event.stopPropagation(); });
            //deja esta linea solo hasta data, despues do text.enter()
            var text = g.selectAll("text")
                .data(nodes)
                .enter()
                .append("text")
                .attr("class", "label")
                .style("fill-opacity", function (d) { return d.parent === root ? 1 : 0; })
                .style("display", function (d) { return d.parent === root ? "inline" : "none"; })
                //show this text only on hover!
                .text(function (d) {
                    var val = "";
                    if (d.parent) {
                        val = d.data.name_x + "\n" + "ABV: " + d.data.abv + "\n" + "IBU: " + d.data.ibu;
                    } else {
                        val = d.key;
                    }
                    return val;
                });

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


         function updateVis(){
            filterData();
            var focus = root,
                nodes = pack(root).descendants(),
                view;
            console.log(nodes);
            text.attr('x', function(d){return d.x})
            .attr('y', function(d){return d.y})
            .text(function(d){return d.data.name_x});
  // EXIT
  // Remove old elements as needed.
            text.exit().remove();

            circle.transition().duration(3000)
            .attr('cx', function(d){return d.x})
            .attr('cy', function(d){return d.y})
            .attr('r', function(d){
                return d.r;
            })

            circle.exit().remove();
        }

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