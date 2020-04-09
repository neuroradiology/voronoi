import {defined,html} from "./utils.js"

/**
 * returns the first counter clockwise point, depending if the site is the leftSite of the edge or its rightSite
 * @param {Half Edge} he 
 */
function first_ccw(he){
    return (defined(he.edge.lSite) && (he.site.id == he.edge.lSite.id))?he.edge.va:he.edge.vb
}


function center(he){
    return ({x:(he.edge.va.x+he.edge.vb.x)/2,y:(he.edge.va.y+he.edge.vb.y)/2})
}

function edge_length(he){
    const dx = he.edge.va.x-he.edge.vb.x
    const dy = he.edge.va.y-he.edge.vb.y
    return Math.sqrt(dx * dx + dy * dy)
}

function circ(parent,x,y,id){
    return html(parent,"circle",
    /*html*/`<circle id=${id} cx=${x} cy=${y} r="3" stroke="black" stroke-width="0" fill="blue" />`
    );
}

function line(parent,a,b){
    let d = `M ${a.x} ${a.y} L ${b.x} ${b.y} `
    return html(parent,"path",
    /*html*/`<path d="${d}" stroke="black" stroke-width="1" />`
    )
}

function get_cell_vertices(cell){
    let res = []
    for(let i=0;i<cell.halfedges.length;i++){
        res.push(first_ccw(cell.halfedges[i]))
    }
    return res
}

function draw_cell_bezier_cubic(c,min_edge,parent,debug){
    let vertices = get_cell_vertices(c)
    let prev = vertices[0]
    let first = prev
    if(debug){
        circ(parent,first.x,first.y)
    }
    for(let i=1;i<vertices.length;i++){
        if(debug){
            line(parent,prev,vertices[i])
            circ(parent,vertices[i].x,vertices[i].y)
            prev = vertices[i]
        }
    }
    if(debug){
        line(parent,first,prev)
    }
return ""
}

function draw_cell_bezier_quadratic(c){
    //console.log(c.halfedges.length)
    if(c.halfedges.length == 0){
        return ""
    }
    const Q0 = first_ccw(c.halfedges[0])
    let cent = center(c.halfedges[0])
    const center0 = cent
    let d = `M ${cent.x} ${cent.y} `
    for(let j=1;j<c.halfedges.length;j++){
        const Q = first_ccw(c.halfedges[j])
        cent = center(c.halfedges[j])
        d = d + `Q ${Q.x} ${Q.y} ${cent.x} ${cent.y} `
    }
    d = d + `Q ${Q0.x} ${Q0.y} ${center0.x} ${center0.y} `
    return d
}


class Svg{
    circle(parent,x,y,id){
        return html(parent,"circle",
        /*html*/`<circle id=${id} cx=${x} cy=${y} r="3" stroke="black" stroke-width="3" fill="red" />`
        );
    }
    
    circle_move(element,coord){
        element.setAttributeNS(null,"cx",coord.x)
        element.setAttributeNS(null,"cy",coord.y)
    }
    
    draw_path(parent,edges,width){
        let group = html(parent,"g",/*html*/`<g id="svg_g_edges"/>`)
        let d = ""
        edges.forEach((e)=>{
            d = d + `M ${e.va.x} ${e.va.y} L ${e.vb.x} ${e.vb.y} `
        })
        return html(group,"path",
        /*html*/`<path id="svg_path_edges" d="${d}" stroke="black" stroke-width="${width}" />`
        )
    
    }
    
    rand_col() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }
    
    draw_cells(parent,cells,col=false){
        let res = []
        if(cells.length>1){//otherwise single cell has no half edges
            for(let i=0;i<cells.length;i++){
                const c = cells[i]
                const p = first_ccw(c.halfedges[0])
                let d = `M ${p.x} ${p.y} `
                for(let j=1;j<c.halfedges.length;j++){
                    const p = first_ccw(c.halfedges[j])
                    d = d + `L ${p.x} ${p.y} `
                }
                d = d + "z"
                const color = (col)?this.rand_col():"#221155"
                let cell_svg = html(parent,"path",
                /*html*/`<path d="${d}" stroke="black" stroke-width="0" fill="${color}" fill-opacity="0.2"/>`
                )
                res.push(cell_svg)
            }
        }
        return res
    }
    
    draw_cells_bezier(parent,cells,min_edge=0,col=false){
        let res = []
        if(cells.length>1){//otherwise single cell has no half edges
            let group = html(parent,"g",/*html*/`<g id="svg_g_bezier_cells"/>`)
            for(let i=0;i<cells.length;i++){

                const d = draw_cell_bezier_quadratic(cells[i],min_edge,parent,(i==2))
                const color = (col==true)?this.rand_col():"#221155"
                let cell_svg = html(group,"path",
                /*html*/`<path d="${d}" stroke="black" stroke-width="0" fill="${color}" fill-opacity="0.2"/>`
                )
                res.push(cell_svg)
            }
        }
        return res
    }

    draw_seeds(parent,seeds){
        let svg_seeds = []
        if(seeds.length > 0){
            let group = html(parent,"g",/*html*/`<g id="svg_g_seeds"/>`)
            for(let i=0;i<seeds.length;i++){
                const s = seeds[i]
                let c = this.circle(group,s.x,s.y,`c_${s.id}`)
                svg_seeds.push(c)
            }
        }
        return svg_seeds
    }
    
    save(svg,fileName){
        let s = new XMLSerializer();
        const svg_str = s.serializeToString(svg);
        var blob = new Blob([svg_str], {type: 'image/svg+xml'});
        saveAs(blob, fileName);
    }
    
}


export{
    Svg
}
