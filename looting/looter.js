let next_chest_level = 4;
let equipped = [
    {id: 0, tier: 0},
    {id: 0, tier: 0},
    {id: 0, tier: 0},
    {id: 0, tier: 0}
]

let item_center_icon = null;

const NUM_EACH = [
    60, 31, 56, 105
]

const TYPS = ["weapon", "armour", "ring", "skill"];

let files = [

]

for (let i=0; i<4; i++) {
    files.push([])
    for (let j=0; j<NUM_EACH[i]; j++) {
        let img = new Image();
        img.src = resolve_item_source(TYPS[i], j)
        files[i].push(img);
    }
}

let sidebar_open = false;
let mouse_on_right = false;

let chest_openable = false;

let expl_audio = new Audio('explosion.mp3');
let get_item_audio = new Audio('get_item.mp3');
let equip_audio = new Audio('clickPlant2.mp3');
let equip_audio2 = new Audio('handleSmallLeather.ogg');
let the_big_one = new Audio('the_big_one.mp3');

function show_sidebar() {
    document.getElementById("sidebar").classList.remove("invisible");
    document.getElementById("sidebar").classList.add("visible");

    sidebar_open = true;
}

function hide_sidebar() {
    document.getElementById("sidebar").classList.remove("visible");
    document.getElementById("sidebar").classList.add("invisible");

    sidebar_open = false;
}

function next_chest_roll() {
    return Math.floor(Math.min(4, Math.min(
        0 + (Math.random() * 5),
        Math.random() * 5
    )));
}

function get_next_chest() {
    next_chest_level = next_chest_roll();
}

function benchmark_chest_type_chances() {
    let results = new Array(1e6).fill(0).map(next_chest_roll);

    console.log(new Array(5).fill(0).map((_, i) => `Tier ${i} | ${
        ((Math.floor(10000 * results.filter(v => v==i).length / results.length) / 100) + "%").padEnd(8)
    } [${
        "#".repeat(100 * results.filter(v => v==i).length / results.length).padEnd(100)
    }]`).join("\n"))
}

function benchmark_total_rarity_chances() {
    let results = new Array(6e5).fill(0).map(_ => draw_from_chest(next_chest_roll()).tier);

    console.log(new Array(6).fill(0).map((_, i) => `Tier ${i} | ${
        ((Math.floor(10000 * results.filter(v => v==i).length / results.length) / 100) + "%").padEnd(8)
    } [${
        "#".repeat(100 * results.filter(v => v==i).length / results.length).padEnd(100)
    }]`).join("\n"))
}

function show_center_chest_icon() {
    item_center_icon.style.visibility = "unset";
    item_center_icon.src = `chests/t${next_chest_level+1}.png`;

    item_center_icon.className = "item";
    item_center_icon.classList.add(`rarity0`);

    item_center_icon.classList.add("hidden");

    window.requestAnimationFrame(function() {
        item_center_icon.classList.remove("hidden");
    })

    setTimeout(function() {
        chest_openable = true;
    }, 500);
}

function set_center_image_icon(source, id, tier) {
    item_center_icon.src = resolve_item_source(source, id);
    item_center_icon.className = "item";
    item_center_icon.classList.add(`rarity${tier}`);
}

function start_roulette(chest_level) {
    chest_openable = false;
    let n = 24;
    setTimeout(show_sidebar, 0);

    let fn = function() {
        let result = draw_from_chest(chest_level);
        set_center_image_icon(TYPS[result.typ], result.id, result.tier);

        n--;
        equip_audio.play();
        if (n > 0) {
            setTimeout(fn, 50);
        } else {
            item_center_icon.style.visibility = "hidden";
            item_center_icon.classList.add("hidden");

            get_next_chest();
            save_equipment();

            show_overlay_popin(draw_from_chest(chest_level))
        }
    }

    fn();
}

function show_overlay_popin(item) {
    let result = document.getElementById("center-loot-box-item-result");
    result.style.visibility = "unset";

    result.classList.remove("hidden");
    result.src = resolve_item_source(TYPS[item.typ], item.id);

    result.className = "item-result";
    result.classList.add(`rarity${item.tier}`)

    let timeout = 500;
    if (item.tier < 5) {
        get_item_audio.play();
    } else {
        the_big_one.play();
        timeout = 3500;
    }

    setTimeout(function() {
        if (item.tier >= equipped[item.typ].tier) {
            fly_popin_to_position(item)
        } else {
            trash_popin();
        }
    }, timeout);
}

function trash_popin() {
    let result_obj = document.getElementById("center-loot-box-item-result");
    
    let start_coords_x = result_obj.getBoundingClientRect().left;
    let start_coords_y = result_obj.getBoundingClientRect().top;

    let cur_pos = [0, 0];
    let cur_speed = [
        (Math.random() * 1000) - 500,
        -1000
    ];

    let rotation = 0;
    let rotation_speed = 360;

    let gravity = 3000;
    let fc = 0;
    let lt = Date.now();

    let animation_fn = function() {
        let dt = (Date.now() - lt) / 1000;
        lt = Date.now();

        fc++;

        cur_pos[0] += cur_speed[0] * dt;
        cur_pos[1] += cur_speed[1] * dt;

        cur_speed[1] += gravity * dt;

        rotation = (rotation + (rotation_speed * dt)) % 360;

        if (start_coords_y + cur_pos[1] >= window.innerHeight) {
            // make the popin vanish, set the item, refresh the sidebar and set a timeout to hide it again
            result_obj.style.visibility = "hidden";
            result_obj.style.left = "unset";
            result_obj.style.top = "unset";
            result_obj.classList.add("hidden");
            result_obj.style.transform = `unset`;

            let a_elem = document.createElement("a");
            a_elem.href = "../index.html";

            let expl = document.createElement("img");
            expl.className = "EXPLOSION";
            expl.style.left = (start_coords_x + cur_pos[0] - 71) + "px";
            expl.style.top = (start_coords_y + cur_pos[1] - 200) + "px";
            expl.src = `gm6_explosion.gif?t=${Date.now()}`;

            expl_audio.play();

            setTimeout(function() {
                a_elem.remove();
            }, 2000);

            document.body.appendChild(a_elem);
            a_elem.appendChild(expl);

            setTimeout(function() {
                if (!mouse_on_right) {
                    hide_sidebar();
                }
            }, 500);

            setTimeout(show_center_chest_icon, 500);
        } else {
            result_obj.style.left = cur_pos[0] + "px";
            result_obj.style.top = cur_pos[1] + "px";
            result_obj.style.transform = `rotate(${rotation}deg)`;

            window.requestAnimationFrame(animation_fn);
        }
    }

    window.requestAnimationFrame(animation_fn);
}

function fly_popin_to_position(item) {
    let result_obj = document.getElementById("center-loot-box-item-result");
    let target_obj = document.getElementById(`${TYPS[item.typ]}-item-box-item`);

    let start_coords_x = result_obj.getBoundingClientRect().left;
    let start_coords_y = result_obj.getBoundingClientRect().top;
    
    let end_coords = target_obj.getBoundingClientRect();

    let end_coords_x = end_coords.left - (sidebar_open ? 0 : 511);
    let end_coords_y = end_coords.top;

    let fc = 0;
    let sidebar_up = false;
    let cur_pos = [0, 0];
    let cur_speed = [
        -(end_coords_x - start_coords_x) * 0.8,
        -(end_coords_y - start_coords_y) * 0.8
    ];

    let accel = 2.6;
    let mul = 2;

    let lt = Date.now();

    let animation_fn = function() {
        let dt = (Date.now() - lt) / 1000;
        lt = Date.now();

        fc++;

        cur_pos[0] += cur_speed[0] * dt;
        cur_pos[1] += cur_speed[1] * dt;

        cur_speed[0] += -(start_coords_x-end_coords_x) * accel * dt;
        cur_speed[1] += -(start_coords_y-end_coords_y) * accel * dt;

        cur_speed[0] *= 1 + (mul * dt);
        cur_speed[1] *= 1 + (mul * dt);

        if (cur_pos[0] >= (end_coords_x-start_coords_x)) {
            // make the popin vanish, set the item, refresh the sidebar and set a timeout to hide it again
            result_obj.style.visibility = "hidden";
            result_obj.style.left = "unset";
            result_obj.style.top = "unset";
            result_obj.classList.add("hidden");

            equipped[item.typ] = {id: item.id, tier: item.tier};
            refresh_equipped_items();

            //equip_audio.play();
            equip_audio2.play();

            setTimeout(function() {
                if (!mouse_on_right) {
                    hide_sidebar();
                }
            }, 500);
            setTimeout(show_center_chest_icon, 1000);
        } else {
            result_obj.style.left = cur_pos[0] + "px";
            result_obj.style.top = cur_pos[1] + "px";

            window.requestAnimationFrame(animation_fn);
        }
    }

    window.requestAnimationFrame(animation_fn);
}

function benchmark_chest_chances() {
    for (let chest_level=0; chest_level<5; chest_level++) {
        let results = new Array(1e6).fill(0).map(_ => draw_from_chest(chest_level).tier);
        
        console.log(`Chest tier ${chest_level} - average tier: ${results.reduce((p, c, i) => p+c) / results.length}\n\n${
            new Array(6).fill(0).map((_, i) => `Tier ${i} | ${((Math.round(10000 * (results.filter(v => v==i).length / results.length)) / 100).toString()+"%").padEnd(8)} [${
                "#".repeat(Math.floor(100 * results.filter(v => v==i).length / results.length)).padEnd(100)
            }]`).join("\n")
        }`);
    }
}

function draw_from_chest(chest_tier) {
    let chosen_typ = Math.floor(Math.random() * 4);

    // each chest tier gives +(3^tier) rolls [0-1) for rarity (with advantage)
    let next_threshold = 0;
    let threshold_increase = 2/3;
    let threshold_inc_mul = 1/3;
    let max_rolls_per_tier = 3;

    while (true) {
        let tier = -1;
        let roll = 0;
        for (let i=0; i<(1+Math.floor(Math.random()*(Math.pow(chest_tier+1, max_rolls_per_tier)))); i++) {
            roll = Math.max(Math.random(), roll);
        }

        while (roll > next_threshold && tier < 5) {
            tier++;
            next_threshold += threshold_increase;
            threshold_increase *= threshold_inc_mul;
        }

        let item_index = 1 + Math.floor(Math.random() * NUM_EACH[chosen_typ]);

        // items have a 50% chance to get shifted down a rarity level
        if (Math.random() < 0.5) {
            tier = Math.max(0, tier-1);
        }

        return {id: item_index, tier: tier, typ: chosen_typ};
    }
}

function refresh_equipped_items() {
    ["weapon", "armour", "ring", "skill"].forEach((typ, i) => {
        let elem = document.getElementById(`${typ}-item-box-item`);

        elem.className = "item";
        elem.classList.add(`rarity${equipped[i].tier}`)

        elem.src = resolve_item_source(typ, equipped[i].id)
    })

    save_equipment();
}

function resolve_item_source(typ, id) {
    return `${typ}/${(id).toString().padStart(3, "0")}.png`;
}

function save_equipment() {
    localStorage.setItem("looter-items", JSON.stringify({equipped: equipped, next_chest_level: next_chest_level}));
}

document.addEventListener("DOMContentLoaded", function() {
    item_center_icon = document.getElementById("center-loot-box-item")

    let t = localStorage.getItem("looter-items");
    if (t && JSON.parse(t).equipped) {
        equipped = JSON.parse(t).equipped;
        next_chest_level = JSON.parse(t).next_chest_level;
        show_center_chest_icon();
    } else {
        get_next_chest();
        show_center_chest_icon();
    }

    refresh_equipped_items();

    document.body.addEventListener("mousemove", function(e) {
        mouse_on_right = false;
        if (window.innerWidth - e.clientX < 128) {
            mouse_on_right = true;
            if (!sidebar_open) {
                show_sidebar();
            }
        } else {
            if (sidebar_open && chest_openable) {
                hide_sidebar();
            }
        }
    })

    document.getElementById("center-loot-box-item").addEventListener("click", function() {
        if (chest_openable) {
            start_roulette(next_chest_level);
        }
    })
})