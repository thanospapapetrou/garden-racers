'use strict';

class Garden {
    static #ATTRIBUTES = ['position'];
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

            this.#array = this.#gl.createVertexArray();
            this.#gl.bindVertexArray(this.#array);
            new RenderingData(this.#gl, this.#gl.ARRAY_BUFFER, new Float32Array(this.#positions(garden)));
            this.#gl.vertexAttribPointer(this.#renderer.attributes.position, 3, gl.FLOAT, false, 0, 0);
            this.#gl.enableVertexAttribArray(this.#renderer.attributes.position);
            // TODO refactor
            const indices = this.#indices(garden);
            new RenderingData(this.#gl, this.#gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices));
            this.#gl.bindVertexArray(null);
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
                let altitude = 0.0;
                if ((latitude % 2 == 1) && (longitude % 2 == 1)) { // center
                    altitude = garden.altitudes[lat * garden.longitude + long];
                } else if (latitude % 2 == 1) { // average east and west
                    altitude = (garden.altitudes[lat * garden.longitude + Math.min(long + 1, garden.longitude - 1)]
                            + garden.altitudes[lat * garden.longitude + Math.max(long, 0)]) / 2.0;
                } else if (longitude % 2 == 1) { // average north and south
                    altitude = (garden.altitudes[Math.min(lat + 1, garden.latitude - 1) * garden.longitude + long]
                            + garden.altitudes[Math.max(lat, 0) * garden.longitude + long]) / 2.0;
                } else { // average all directions
                    altitude = (garden.altitudes[Math.min(lat + 1, garden.latitude - 1) * garden.longitude + Math.max(long, 0)]
                            + garden.altitudes[Math.max(lat, 0) * garden.longitude + Math.min(long + 1, garden.longitude - 1)]
                            + garden.altitudes[Math.max(lat, 0) * garden.longitude + Math.max(long, 0)]
                            + garden.altitudes[Math.max(lat, 0) * garden.longitude + Math.max(long, 0)]) / 4.0;
                }
                positions.push(longitude / 2.0, altitude, -latitude / 2.0);
            }
        }
        return positions;
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
                    const nextDir = Object.values(Direction)[(direction + 1) % Object.keys(Direction).length](lat, long);
                    indices.push(dir.lat * n + dir.long,
                        lat * n + long,
                        nextDir.lat * n + nextDir.long
                    );
                }
            }
        }
        return indices;
    }
}
