'use strict';

class Garden {
    static #ATTRIBUTES = ['position', 'normal'];
    static #SHADER_FRAGMENT = './glsl/garden.frag';
    static #SHADER_VERTEX = './glsl/garden.vert';
    static #UNIFORMS = {
        projection: (gl, uniform, projection) => gl.uniformMatrix4fv(uniform, false, projection),
        camera: (gl, uniform, camera) => gl.uniformMatrix4fv(uniform, false, camera),
        model: (gl, uniform, model) => gl.uniformMatrix4fv(uniform, false, model),
        light: {
            ambient: (gl, uniform, color) => gl.uniform3fv(uniform, color),
            directional: {
                color: (gl, uniform, color) => gl.uniform3fv(uniform, color),
                direction: (gl, uniform, direction) => gl.uniform3fv(uniform, direction)
            }
        }
    };

    #garden;
    #task;

    constructor(gl, url) {
        return (async () => {
            this.#garden = await(await GardenRacers.load(url)).json();
            this.#task = new RenderingTask(gl, await new Renderer(gl, Garden.#SHADER_VERTEX, Garden.#SHADER_FRAGMENT,
                    Garden.#UNIFORMS, Garden.#ATTRIBUTES), {
                        position: new AttributeData(gl, this.#positions),
                        normal: new AttributeData(gl, this.#normals)
                    }, new IndexData(gl, this.#indices));
            return this;
        })();
    }

    render(projection, camera, model) {
        this.#task.render({projection, camera, model});
    }

    get #positions() {
        const positions = [];
        for (let latitude = 0; latitude < 2 * this.#garden.latitude + 1; latitude++) {
            for (let longitude = 0; longitude < 2 * this.#garden.longitude + 1; longitude++) {
                const lat = Math.floor((latitude - 1) / 2);
                const long = Math.floor((longitude - 1) / 2);
                const north = Math.min(lat + 1, this.#garden.latitude - 1);
                const east = Math.min(long + 1, this.#garden.longitude - 1);
                const south = Math.max(lat, 0);
                const west = Math.max(long, 0);
                let altitude = 0.0;
                if ((latitude % 2 == 1) && (longitude % 2 == 1)) { // between parallels and between meridians; altitude
                    altitude = this.#garden.altitudes[lat * this.#garden.longitude + long];
                } else if (latitude % 2 == 1) { // between parallels and on meridian; average east and west
                    altitude = (this.#garden.altitudes[lat * this.#garden.longitude + east]
                            + this.#garden.altitudes[lat * this.#garden.longitude + west]) / 2.0;
                } else if (longitude % 2 == 1) { // on parallel between meridians; average north and south
                    altitude = (this.#garden.altitudes[north * this.#garden.longitude + long]
                            + this.#garden.altitudes[south * this.#garden.longitude + long]) / 2.0;
                } else { // on parallel and on meridian; average all directions
                    altitude = (this.#garden.altitudes[north * this.#garden.longitude + east]
                            + this.#garden.altitudes[south * this.#garden.longitude + east]
                            + this.#garden.altitudes[south * this.#garden.longitude + west]
                            + this.#garden.altitudes[north * this.#garden.longitude + west]) / 4.0;
                }
                positions.push(longitude / 2.0, latitude / 2.0, altitude);
            }
        }
        return positions;
    }

    get #normals() {
        const normals = [];
        for (let latitude = 0; latitude < 2 * this.#garden.latitude + 1; latitude++) {
            for (let longitude = 0; longitude < 2 * this.#garden.longitude + 1; longitude++) {
                if ((latitude % 2 == 1) && (longitude % 2 == 1)) { // between parallels and between meridians
                    const center = latitude * this.#garden.longitude + longitude;
                    const north = (latitude + 1) * this.#garden.longitude + longitude;
                    const northEast = (latitude + 1) * this.#garden.longitude + longitude + 1;
                    const east = latitude * this.#garden.longitude + longitude + 1;
                    const southEast = (latitude - 1) * this.#garden.longitude + longitude + 1;
                    const south = (latitude - 1) * this.#garden.longitude + longitude;
                    const southWest = (latitude - 1) * this.#garden.longitude + longitude - 1;
                    const west = latitude * this.#garden.longitude + longitude - 1;
                    const northWest = (latitude + 1) * this.#garden.longitude + longitude - 1;
                    const c = this.#getPosition(this.#positions, center);
                    const n = this.#getPosition(this.#positions, north);
                    const ne = this.#getPosition(this.#positions, northEast);
                    const e = this.#getPosition(this.#positions, east);
                    const se = this.#getPosition(this.#positions, southEast);
                    const s = this.#getPosition(this.#positions, south);
                    const sw = this.#getPosition(this.#positions, southWest);
                    const w = this.#getPosition(this.#positions, west);
                    const nw = this.#getPosition(this.#positions, northWest);
                    const normal = this.#average(this.#normal(n, c, ne),
                            this.#normal(ne, c, e),
                            this.#normal(e, c, se),
                            this.#normal(se, c, s),
                            this.#normal(s, c, sw),
                            this.#normal(sw, c, w),
                            this.#normal(w, c, nw),
                            this.#normal(nw, c, n));
                    // TODO
                    normals.push(normal.x, normal.y, normal.z);
                } else if (latitude % 2 == 1) { // between parallels and on meridian
                    normals.push(0.0, 0.0, 1.0);
                } else if (longitude % 2 == 1) { // on parallel between meridians
                    normals.push(0.0, 0.0, 1.0);
                } else { // on parallel and on meridian
                    normals.push(0.0, 0.0, 1.0);
                }
            }
        }
        return normals;
    }

    get #indices() {
        const indices = [];
        const n = 2 * this.#garden.longitude + 1;
        for (let latitude = 0; latitude < this.#garden.latitude; latitude++) {
            for (let longitude = 0; longitude < this.#garden.longitude; longitude++) {
                const lat = 2 * latitude + 1;
                const long = 2 * longitude + 1;
                for (let direction = 0; direction < Object.keys(Direction).length; direction++) {
                    const dir = Object.values(Direction)[direction](lat, long);
                    const next = Object.values(Direction)[(direction + 1) % Object.keys(Direction).length](lat, long);
                    indices.push(dir.lat * n + dir.long, lat * n + long, next.lat * n + next.long);
                }
            }
        }
        return indices;
    }

    #getPosition(positions, i) {
        return {x: positions[i * 3], y: positions[i * 3 + 1], z: positions[i * 3 + 2]};
    }

    #normal(a, b, c) {
        return this.#normalize(this.#cross(this.#subtract(b, a), this.#subtract(c, b)));
    }

    #average(... as) {
        let result = {x: 0.0, y: 0.0, z: 0.0};
        for (const a of as) {
            result = this.#add(result, a);
        }
        return this.#divide(result, as.length);
    }

    #add(a, b) {
        return {x: a.x + b.x, y: a.y + b.y, z: a.z + b.z};
    }

    #subtract(a, b) {
        return {x: a.x - b.x, y: a.y - b.y, z: a.z = b.z};
    }

    #divide(a, b) {
        return {x: a.x / b, y: a.y / b, z: a.z / b};
    }

    #cross(a, b) {
        return {x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x};
    }

    #normalize(a) {
        return Math.sqrt(Math.pow(a.x, 2) + Math.pow(a.y, 2) + Math.pow(a.z, 2));
    }
}
