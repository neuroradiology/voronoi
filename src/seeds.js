import { defined,html,save_json } from "./utils.js"
import {Svg} from "./svg_utils.js"
import {Geometry} from "./geometry.js"

let geom = new Geometry()
let svg = new Svg()


function get_seeds(nb,w,h){
    let res = []
    for(let i = 0;i<nb; i++){
        res.push({
            id:i,
            x:Math.random()*w,
            y:Math.random()*h
        })
    }
    return res
}

function get_seed_samples(nb,w,h){
    let res = []
    for(let i = 0;i<nb; i++){
        res.push({
            x:Math.random()*w,
            y:Math.random()*h
        })
    }
    return res
}

function get_best_sample(seeds,samples,w,h,walls=false){
    let best_index = 0
    let biggest_min = 0
    for(let i=0;i<samples.length;i++){
        let seeds_cost = []
        for(let j= 0;j<seeds.length;j++){
            const d = geom.distance(samples[i],seeds[j])
            seeds_cost.push(d)
        }
        if(walls){
            seeds_cost.push(geom.walls_distance(samples[i],w,h))
        }
        const min_dist = Math.min(...seeds_cost)
        if(min_dist > biggest_min){
            best_index = i
            biggest_min = min_dist
        }
    }
    //console.log(`biggest_min = ${biggest_min}`)
    return samples[best_index]
}

function get_best_path_sample(seeds,samples,path_points){
    let best_index = 0
    let biggest_min = 0
    for(let i=0;i<samples.length;i++){
        let seeds_cost = []
        for(let j= 0;j<seeds.length;j++){
            const d = geom.distance(samples[i],seeds[j])
            seeds_cost.push(d)
        }
        for(let j= 0;j<path_points.length;j++){
            const d = geom.distance(samples[i],path_points[j])
            seeds_cost.push(d)
        }
        const min_dist = Math.min(...seeds_cost)
        if(min_dist > biggest_min){
            best_index = i
            biggest_min = min_dist
        }
    }
    //console.log(`biggest_min = ${biggest_min}`)
    return samples[best_index]
}

function get_closest_index(seeds,coord){
    let index_of_closest = 0
    let closest_dist = Number.MAX_VALUE
    for(let i=0;i<seeds.length;i++){
        const d = geom.distance(coord,seeds[i])
        if(d < closest_dist){
            index_of_closest = i
            closest_dist = d
        }
    }
    return index_of_closest
}

function compute_path_points(path){
    let res = []
    const nb_steps = 20
    const step = path.getTotalLength() / nb_steps
    for(let i=0;i<nb_steps;i++){
        let dist = step * i
        res.push(path.getPointAtLength(dist))
    }
    return res
}

class Seeds{
    constructor(){
        this.array = []

        this.config = {}
        this.config.is_debug = false
        this.config.debug_id = 0
        this.config.nb_seeds = 30
        this.config.max_seeds = 50
        this.config.area = {type:"rect",width:400,height:200}
        this.config.nb_samples = 10
        this.config.walls_dist = true

        this.path_svg = null
        this.path_points = []
    }
    load_config(cfg){
        this.config = cfg
        if(this.config.area.type == "path"){//not supported
            this.config.area.type = "rect"
        }
    }

    get_seed(id,w,h){
        let samples = get_seed_samples(this.config.nb_samples,w,h)
        //console.log(samples)
        const best_seed = get_best_sample(this.array,samples,w,h,this.config.walls_dist)
        return {
            id:id,
            x:best_seed.x,
            y:best_seed.y
        }
    }
    get_point_inside(box,path_id){
        let x,y
        let max_iter = 100
        let inside = false
        while((!inside)&&(max_iter>0)){
            x = box.x + Math.random()*box.width
            y = box.y + Math.random()*box.height
            if(document.elementFromPoint(x, y).id == path_id){
                inside = true
            }
            max_iter--
        }
        if(max_iter == 0){
            console.error(`can't sample in path : max iterations 100 reached`)
        }
        return [x,y]
    }
    get_samples_inside_path(box){
        let res = []
        for(let i=0;i<this.config.nb_samples;i++){
            let [x,y] = this.get_point_inside(box,this.path_id)
            res.push({x:x,y:y})
        }
        return res
    }
    add_seeds_in_path(nb){
        const box = this.path_svg.getBoundingClientRect();
        for(let i=0;i<nb;i++){
            let samples = this.get_samples_inside_path(box)
            let best = get_best_path_sample(this.array,samples,this.path_points)
            //check the cost
            const s = {
                id:i,
                x:best.x,
                y:best.y
            }
            this.array.push(s)
        }
    }
    add_seeds_in_rect(nb){
        const prev_nb = this.array.length
        for(let i=0;i<nb;i++){
            const new_id = prev_nb+i
            const s = this.get_seed(new_id,this.config.area.width,this.config.area.height)
            this.array.push(s)
        }
    }
    seed_outside_rect(coord){
        if(coord.x > this.config.area.width){
            return true
        }
        if(coord.y > this.config.area.height){
            return true
        }
        return false
    }
    check_seeds_in_rect(){
        for(let i=0;i<this.array.length;i++){
            if(this.seed_outside_rect(this.array[i])){
                this.array.splice(i,1)
                i--
            }
        }
    }
    adjust_seeds_number(){
        if(this.config.nb_seeds < this.array.length){
            const nb_pop = this.array.length - this.config.nb_seeds
            for(let i=0;i<nb_pop;i++){
                this.array.pop()
            }
        }else if(this.config.nb_seeds > this.array.length){
            const nb_seeds_to_add = this.config.nb_seeds - this.array.length
            if(this.config.area.type == "path"){
                this.add_seeds_in_path(nb_seeds_to_add)
            }else{
                this.add_seeds_in_rect(nb_seeds_to_add)
            }
        }
    }
    reset_seeds_id(){
        for(let i=0;i<this.array.length;i++){
            this.array[i].id = i
            }
    }


    //-----------------------------------------------------------------------------------------------
    add(coord){
        const new_id = this.array[this.array.length-1].id + 1
        let s = {x:coord.x, y:coord.y, id:new_id}
        this.array.push(s)
    }
    remove(coord){
        const closest = get_closest_index(this.array,coord)
        this.array.splice(closest,1)
    }
    move(coord){
        const closest_index = get_closest_index(this.array,coord)
        let closest_seed = this.array[closest_index]
        closest_seed.x = coord.x
        closest_seed.y = coord.y
    }
    update(params){
        let start = Date.now()
        if(defined(params.clear) && (params.clear == true)){
            this.array = []
        }
        if(defined(params.nb_seeds)){
            this.config.nb_seeds = params.nb_seeds
        }
        if(defined(params.max_seeds)){
            this.config.max_seeds = params.max_seeds
        }
        if(defined(params.walls_dist)){
            this.config.walls_dist = params.walls_dist
        }
        if(defined(params.width)){
            this.config.area.width = params.width
        }
        if(defined(params.height)){
            this.config.area.height = params.height
        }
        if(defined(params.config)){
            this.load_config(params.config)
        }
        if(defined(params.path)){
                this.config.area.type = "path"
            this.path_svg = params.path
            this.path_id = params.id
            this.path_points = compute_path_points(this.path_svg)
            //clear to restart a new sampling on the new path
            this.array = []
        }
        if(this.config.area.type == "rect"){//should only be done on resize
            this.check_seeds_in_rect()
        }
        this.adjust_seeds_number()
        this.reset_seeds_id()
        return (Date.now()-start)
    }

    draw(params){
        svg.set_parent(params.svg)
        if(this.array.length > 0){
            let group = html(params.svg,"g",/*html*/`<g id="svg_g_seeds"/>`)
            for(let i=0;i<this.array.length;i++){
                const s = this.array[i]
                svg.circle_p_id(group,s.x,s.y,`c_${s.id}`)
            }
        }
    }
    save(fileName){
        this.array.forEach((s)=>{
            delete s.voronoiId
        })
        save_json(this.array,fileName)
    }
    load(seeds){
        this.array = seeds
        this.config.nb_seeds = this.array.length
        //laoding seeds ignores current winowd size https://github.com/WebSVG/voronoi/issues/3
    }
    get_seeds(){
        return this.array
    }

}

export{Seeds}