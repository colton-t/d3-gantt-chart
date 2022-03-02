import { LightningElement } from 'lwc';
// D3 imports
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { loadScript } from 'lightning/platformResourceLoader';
import D3 from '@salesforce/resourceUrl/D3';

export default class D3GanttChart extends LightningElement {
    d3Init = false;

    svgWidth = 700;
    svgHeight = 300;

    renderedCallback() {
        if(this.d3Init)
            return;

        Promise.all([loadScript(this, D3 + '/d3.min.js')])
            .then(() => {
                this.d3Init = true;
                this.initD3();
            })
            .catch(error => {
                this.dispatchEvent(
                    console.log('error: ', error),
                    new ShowToastEvent({
                        title: 'Error loading D3',
                        message: error.message,
                        variant: 'error'
                    })
                );
            });
    }

    initD3(){
        const width = this.svgWidth;
        const height = this.svgHeight;
        const margin = {left: 40, top: 30, right: 40, bottom: 50}
        const getRatio = side => (margin[side] / width) * 100 + '%';

        const marginRatio = {
            left: getRatio('left'),
            top: getRatio('top'),
            right: getRatio('right'),
            bottom: getRatio('bottom')
        }


        const svg = d3.select(this.template.querySelector('div.d3'))
            .append('svg')
            .style('padding', marginRatio.top + ' ' + marginRatio.right + ' ' 
                            + marginRatio.bottom + ' ' + marginRatio.left + ' ')
            .attr('width', this.svgWidth)
            .attr('height', this.svgHeight)
            .attr('viewBox', [0, 0, this.svgWidth + margin.left + margin.right, this.svgHeight + margin.top + margin.bottom])
            .attr("style", "width: 100%; height: auto; height: intrinsic;");

        // create an array of sample data
        let data = [
            {
                meeting: "1st Meeting",
                type: "project",
                date: "03/01/2022",
                label: "Project One",
                status: "approved"
            },
            {
                meeting: "1st Meeting",
                type: "project",
                date: "03/02/2022",
                label: "Project Two",
                status: "voting_round_1"
            },
            {
                meeting: "1st Meeting",
                type: "project",
                date: "03/03/2022",
                label: "Project Three",
                status: "voting_round_2"
            },
            {
                meeting: "1st Meeting",
                type: "project",
                date: "03/04/2022",
                label: "Project Four",
                status: "voting_round_3"
            },
            {
                meeting: "1st Meeting",
                type: "project",
                date: "03/06/2022",
                label: "Project Five",
                status: "pending"
            },
            {
                meeting: "1st Meeting",
                type: "project",
                date: "03/01/2022",
                label: "Project Zeta",
                status: "pending"
            },
        ];

        var categories = new Array();

        for (let i = 0; i < data.length; i++) {
            categories.push(data[i].status);
        }

        categories = checkUnique(categories);

        var colorScale = d3.scaleLinear()
            .domain([0, categories.length])
            .range(["#00B9FA", "#F95002"])
            .interpolate(d3.interpolateHcl);
        
        var timeScale = d3.scaleBand()
            .domain(d3.map(data, function(d) { return d.date }))
            .range([0, width])
            .padding(0.2);

        
        var xAxis = d3.axisBottom()
            .scale(timeScale)
            .tickSize(-height,0,0)
            .tickSizeOuter(0);

        let grid = svg.append("g")
            .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

        grid.append('g')
            .attr("class", "x-axis")
            .attr("transform", "translate(0," + (height) + ")")
            .call(xAxis)

        const yScale = d3.scaleLinear().domain([0, data.length]).range([height - margin.top, 0]);

        grid.append("g")
            .attr("class", "y-axis")
            .attr("transform", "translate(0," + margin.top + ")")
            .call(d3.axisLeft(yScale).tickSize(0).tickFormat(function(d){
                if (d > 0 )
                    return "Task " + d;
                else
                    return;
            })
            .ticks(data.length))
            .call(grid => grid.select(".domain").remove());
            
        
        var projects = svg
            .append('g')
            .attr("transform", "translate(" + margin.left + ", " + 0 + ")")
            .selectAll("this_is_empty")
            .data(data)
            .enter();

        var rects = projects
            .append("rect")
            .attr("rx", 3)
            .attr("ry", 3)
            .attr("x", (d,i) => timeScale(d.date))
            .attr("y", (d,i) => yScale(i))
            .attr("width", timeScale.bandwidth())
            .attr("height", 30)
            .attr("stroke", "none")
            .attr("fill", d => d3.rgb(colorScale(categories.indexOf(d.status))));
        
        var rectText = projects.append("text")
            .text(d => d.label)
            .attr("x", d => timeScale(d.date) + timeScale.bandwidth()/2)
            .attr("y", (d,i) => yScale(i) + 20)
            .attr("font-size", 12)
            .attr("text-anchor", "middle")
            .attr("text-height", 30)
            .attr("fill", "#fff")

        var highlightRects = svg.append("g")
            .selectAll("rect")
            .data(data)
            .enter()
            .append("rect")
            .attr("x", 0)
            .attr("y", function(d, i){ return yScale(i) - 5 })
            .attr("width", function(d){ return width + margin.left + margin.right })
            .attr("height", 40)
            .attr("stroke", "none")
            .attr("fill",  d => d3.rgb(colorScale(categories.indexOf(d.status))))
            .attr("opacity", 0.2);


        function checkUnique(arr) {
            var hash = {}, result = [];
            for ( var i = 0, l = arr.length; i < l; ++i ) {
                if ( !hash.hasOwnProperty(arr[i]) ) { //it works with objects! in FF, at least
                    hash[ arr[i] ] = true;
                    result.push(arr[i]);
                }
            }
            return result;
        }
    }
}