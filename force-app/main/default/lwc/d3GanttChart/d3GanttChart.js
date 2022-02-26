import { LightningElement } from 'lwc';
// D3 imports
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { loadScript } from 'lightning/platformResourceLoader';
import D3 from '@salesforce/resourceUrl/D3';

export default class D3GanttChart extends LightningElement {
    d3Init = false;

    svgWidth = 500;
    svgHeight = 400;

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
        const margin = {left: 40, top: 30, right: 40, bottom: 50}
        const getRatio = side => (margin[side] / this.svgWidth) * 100 + '%';

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
            //.attr('viewBox', [0, 0, this.svgWidth + margin.left + margin.right, this.svgHeight + margin.top + margin.bottom])
            .attr("style", "width: 100%; height: auto; height: intrinsic;");

        // create an array of sample data
        let data = [
            {x: {start: 1, end: 2 }, y: 10, task: "" },
        ];

        const x = d3.scaleBand().range([0, this.svgWidth]).padding(0.4);
        const y = d3.sclaeLinear().range([this.svgHeight, 0]);

        let g = svg.append("g")
            .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");
        
        //x.domain(data.map(function(d) { return d. }))
    }
}