export function sleep(ms){
    return new Promise(result => setTimeout(result, ms));
}

export function randint(low, high){
    if (high<low){
        console.error(`Invalid randint range: ${low}, ${high}`);
        return low;
    }
    return low + Math.floor( Math.random()*(high-low+1) );
}

export function randsign(){
    return (Math.random()<0.5? 1:-1);
}

export function testChance(chance){
    return (Math.random()<chance);
}

function cross_sign(x, y, a, b){
    let rht= x*b, lft=y*a;
    if (rht>lft) return 1;
    if (rht<lft) return -1;
    return 0;
}

export function collision_line(p1_1, p1_2, p2_1, p2_2){
    let cross_p2_1= cross_sign(p1_2.x-p1_1.x, p1_2.y-p1_1.y, p2_1.x-p1_2.x, p2_1.y-p1_2.y),
        cross_p2_2= cross_sign(p1_2.x-p1_1.x, p1_2.y-p1_1.y, p2_2.x-p1_2.x, p2_2.y-p1_2.y),
        cross_p1_1= cross_sign(p2_2.x-p2_1.x, p2_2.y-p2_1.y, p1_1.x-p2_2.x, p1_1.y-p2_2.y),
        cross_p1_2= cross_sign(p2_2.x-p2_1.x, p2_2.y-p2_1.y, p1_2.x-p2_2.x, p1_2.y-p2_2.y);
    
    if (cross_p1_1 || cross_p1_2 || cross_p2_1 || cross_p2_2)
        return cross_p1_1*cross_p1_2<=0 && cross_p2_1*cross_p2_2<=0;
    if (p1_1.y==p1_2.y && p1_2.y==p2_1.y && p2_1.y==p2_2.y)
        return !(Math.max(p1_1.x, p1_2.x)<Math.min(p2_1.x, p2_2.x) || Math.min(p1_1.x, p1_2.x)>Math.min(p2_1.x, p2_2.x));
    return !(Math.max(p1_1.y, p1_2.y)<Math.min(p2_1.y, p2_2.y) || Math.min(p1_1.y, p1_2.y)>Math.min(p2_1.y, p2_2.y));
}

export function get_direction(p1_1, p1_2, p2){
    return cross_sign(p1_2.x-p1_1.x, p1_2.y-p1_1.y, p2.x-p1_2.x, p2.y-p1_2.y);
}

export function get_boundingBox(...cords){
    if (cords.length===0){
        console.warn('Invalid get_boundingBox parameter');
        return [0,0,0,0];
    }

    let box= {
        minX: cords[0].x,
        minY: cords[0].y,
        maxX: cords[0].x,
        maxY: cords[0].y
    };
    for (const cord of cords){
        box.maxX= Math.max(box.maxX, cord.x);
        box.minX= Math.min(box.minX, cord.x);
        box.maxY= Math.max(box.maxY, cord.y);
        box.minY= Math.min(box.minY, cord.y);
    }
    return box;
}

export function collision_box(box1, box2){
    return !(box1.maxX < box2.minX || box1.minX > box2.maxX || box1.maxY < box2.minY || box1.minY > box2.maxY);
}

export function to_rad(angle){
    return angle/1800*Math.PI;
}