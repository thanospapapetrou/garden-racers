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

    #gl;
    #renderer;
    #array;
    #count;

    constructor(gl, url) {
        this.#gl = gl;
        return (async () => {
            this.#renderer = await new Renderer(this.#gl, Garden.#SHADER_VERTEX, Garden.#SHADER_FRAGMENT,
                    Garden.#UNIFORMS, Garden.#ATTRIBUTES);
            const garden = await(await GardenRacers.load(url)).json();


            const positions = this.#positions(garden);
            const positionBuffer = new RenderingData(this.#gl, this.#gl.ARRAY_BUFFER, new Float32Array(positions))
            const normalBuffer = new RenderingData(this.#gl, this.#gl.ARRAY_BUFFER, new Float32Array(this.#normals(garden, positions)));
            const indices = this.#indices(garden);
            const indexBuffer = new RenderingData(this.#gl, this.#gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices));

            this.#array = this.#gl.createVertexArray();
            this.#gl.bindVertexArray(this.#array);

            this.#gl.bindBuffer(this.#gl.ARRAY_BUFFER, positionBuffer.buffer);
            this.#gl.vertexAttribPointer(this.#renderer.attributes.position, 3, gl.FLOAT, false, 0, 0);
            this.#gl.enableVertexAttribArray(this.#renderer.attributes.position);
            this.#gl.bindBuffer(this.#gl.ARRAY_BUFFER, null);

            this.#gl.bindBuffer(this.#gl.ARRAY_BUFFER, normalBuffer.buffer);
            this.#gl.vertexAttribPointer(this.#renderer.attributes.normal, 3, gl.FLOAT, false, 0, 0);
            this.#gl.enableVertexAttribArray(this.#renderer.attributes.normal);
            this.#gl.bindBuffer(this.#gl.ARRAY_BUFFER, null);

            this.#gl.bindBuffer(this.#gl.ELEMENT_ARRAY_BUFFER, indexBuffer.buffer);

            this.#gl.bindVertexArray(null);
            this.#gl.bindBuffer(this.#gl.ELEMENT_ARRAY_BUFFER, null);

            this.#count = indices.length;
            return this;
        })();
    }

    render(projection, camera, model) {
        this.#gl.useProgram(this.#renderer.program);
        this.#renderer.uniforms.projection = projection;
        this.#renderer.uniforms.camera = camera;
        this.#renderer.uniforms.model = model;
        this.#renderer.uniforms.light.ambient = [0.25, 0.25, 0.25]; // 25% white TODO
        this.#renderer.uniforms.light.directional.color = [0.75, 0.75, 0.75]; // 75% white TODO
        this.#renderer.uniforms.light.directional.direction = [-1.0, -1.0, -1.0]; //  TODO
        // TODO render
        this.#gl.bindVertexArray(this.#array);
        this.#gl.drawElements(this.#gl.TRIANGLES, this.#count, this.#gl.UNSIGNED_SHORT, 0);
    }

    #positions(garden) {
        const positions = [];
        for (let latitude = 0; latitude < 2 * garden.latitude + 1; latitude++) {
            for (let longitude = 0; longitude < 2 * garden.longitude + 1; longitude++) {
                const lat = Math.floor((latitude - 1) / 2);
                const long = Math.floor((longitude - 1) / 2);
                const north = Math.min(lat + 1, garden.latitude - 1);
                const east = Math.min(long + 1, garden.longitude - 1);
                const south = Math.max(lat, 0);
                const west = Math.max(long, 0);
                let altitude = 0.0;
                if ((latitude % 2 == 1) && (longitude % 2 == 1)) { // between parallels and between meridians; altitude
                    altitude = garden.altitudes[lat * garden.longitude + long];
                } else if (latitude % 2 == 1) { // between parallels and on meridian; average east and west
                    altitude = (garden.altitudes[lat * garden.longitude + east]
                            + garden.altitudes[lat * garden.longitude + west]) / 2.0;
                } else if (longitude % 2 == 1) { // on parallel between meridians; average north and south
                    altitude = (garden.altitudes[north * garden.longitude + long]
                            + garden.altitudes[south * garden.longitude + long]) / 2.0;
                } else { // on parallel and on meridian; average all directions
                    altitude = (garden.altitudes[north * garden.longitude + east]
                            + garden.altitudes[south * garden.longitude + east]
                            + garden.altitudes[south * garden.longitude + west]
                            + garden.altitudes[north * garden.longitude + west]) / 4.0;
                }
                positions.push(longitude / 2.0, latitude / 2.0, altitude);
            }
        }
        return positions;
    }

    #normals(garden, positions) {
        const normals = [];
        for (let latitude = 0; latitude < 2 * garden.latitude + 1; latitude++) {
            for (let longitude = 0; longitude < 2 * garden.longitude + 1; longitude++) {
                if ((latitude % 2 == 1) && (longitude % 2 == 1)) { // between parallels and between meridians
                    const center = latitude * garden.longitude + longitude;
                    const north = (latitude + 1) * garden.longitude + longitude;
                    const northEast = (latitude + 1) * garden.longitude + longitude + 1;
                    const east = latitude * garden.longitude + longitude + 1;
                    const southEast = (latitude - 1) * garden.longitude + longitude + 1;
                    const south = (latitude - 1) * garden.longitude + longitude;
                    const southWest = (latitude - 1) * garden.longitude + longitude - 1;
                    const west = latitude * garden.longitude + longitude - 1;
                    const northWest = (latitude + 1) * garden.longitude + longitude - 1;
                    const c = this.#getPosition(positions, center);
                    const n = this.#getPosition(positions, north);
                    const ne = this.#getPosition(positions, northEast);
                    const e = this.#getPosition(positions, east);
                    const se = this.#getPosition(positions, southEast);
                    const s = this.#getPosition(positions, south);
                    const sw = this.#getPosition(positions, southWest);
                    const w = this.#getPosition(positions, west);
                    const nw = this.#getPosition(positions, northWest);
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

    #indices(garden) {
        const indices = [];
        const n = 2 * garden.longitude + 1;
        for (let latitude = 0; latitude < garden.latitude; latitude++) {
            for (let longitude = 0; longitude < garden.longitude; longitude++) {
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
