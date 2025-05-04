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
    #positions;
    #normals;
    #indices;
    #task;

    constructor(gl, url) {
        return (async () => {
            this.#garden = await(await GardenRacers.load(url)).json();
            this.#calculatePositions();
            this.#calculateNormals();
            this.#calculateIndices();
            this.#task = new RenderingTask(gl, await new Renderer(gl, Garden.#SHADER_VERTEX, Garden.#SHADER_FRAGMENT,
                    Garden.#UNIFORMS, Garden.#ATTRIBUTES), {
                        position: new AttributeData(gl, this.#positions),
                        normal: new AttributeData(gl, this.#normals)
                    }, new IndexData(gl, this.#indices));
            return this;
        })();
    }

    render(projection, camera, model, light) {
        this.#task.render({projection, camera, model, light});
    }

    #calculatePositions() {
        this.#positions = [];
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
                this.#positions.push(longitude / 2.0, latitude / 2.0, altitude);
            }
        }
    }

    #calculateNormals() {
        this.#normals = [];
        for (let latitude = 0; latitude < 2 * this.#garden.latitude + 1; latitude++) {
            for (let longitude = 0; longitude < 2 * this.#garden.longitude + 1; longitude++) {
                const c = this.#getPosition(latitude, longitude);
                const n = this.#getPosition(latitude + 1, longitude);
                const ne = this.#getPosition(latitude + 1, longitude + 1);
                const e = this.#getPosition(latitude, longitude + 1);
                const se = this.#getPosition(latitude - 1, longitude + 1);
                const s = this.#getPosition(latitude - 1, longitude);
                const sw = this.#getPosition(latitude - 1, longitude - 1);
                const w = this.#getPosition(latitude, longitude - 1);
                const nw = this.#getPosition(latitude + 1, longitude - 1);
                let normal = null; // TODO refactor to reduce size
                if ((latitude % 2 == 1) && (longitude % 2 == 1)) { // between parallels and between meridians
                    normal = this.#calculateNormal(n, c, ne)
                            .add(this.#calculateNormal(ne, c, e))
                            .add(this.#calculateNormal(e, c, se))
                            .add(this.#calculateNormal(se, c, s))
                            .add(this.#calculateNormal(s, c, sw))
                            .add(this.#calculateNormal(sw, c, w))
                            .add(this.#calculateNormal(w, c, nw))
                            .add(this.#calculateNormal(nw, c, n))
                            .normalize();
                } else if (latitude % 2 == 1) { // between parallels and on meridian
                    normal = this.#calculateNormal(n, c, e)
                            .add(this.#calculateNormal(e, c, s))
                            .add(this.#calculateNormal(s, c, w))
                            .add(this.#calculateNormal(w, c, n))
                            .normalize();
                } else if (longitude % 2 == 1) { // on parallel between meridians
                    normal = this.#calculateNormal(n, c, e)
                            .add(this.#calculateNormal(e, c, s))
                            .add(this.#calculateNormal(s, c, w))
                            .add(this.#calculateNormal(w, c, n))
                            .normalize();
                } else { // on parallel and on meridian
                    normal = this.#calculateNormal(n, c, ne)
                            .add(this.#calculateNormal(ne, c, e))
                            .add(this.#calculateNormal(e, c, se))
                            .add(this.#calculateNormal(se, c, s))
                            .add(this.#calculateNormal(s, c, sw))
                            .add(this.#calculateNormal(sw, c, w))
                            .add(this.#calculateNormal(w, c, nw))
                            .add(this.#calculateNormal(nw, c, n))
                            .normalize();
                }
                this.#normals.push(normal.x, normal.y, normal.z);
            }
        }
    }

    #calculateIndices() {
        this.#indices = [];
        const n = 2 * this.#garden.longitude + 1;
        for (let latitude = 0; latitude < this.#garden.latitude; latitude++) {
            for (let longitude = 0; longitude < this.#garden.longitude; longitude++) {
                const lat = 2 * latitude + 1;
                const long = 2 * longitude + 1;
                for (let direction = 0; direction < Object.keys(Direction).length; direction++) {
                    const dir = Object.values(Direction)[direction](lat, long);
                    const next = Object.values(Direction)[(direction + 1) % Object.keys(Direction).length](lat, long);
                    this.#indices.push(dir.lat * n + dir.long, lat * n + long, next.lat * n + next.long);
                }
            }
        }
        return this.#indices;
    }

    #getPosition(latitude, longitude) {
        const offset = (Math.min(Math.max(latitude, 0), this.#garden.latitude - 1) * this.#garden.longitude
                + Math.min(Math.max(longitude, 0), this.#garden.latitude)) * Vector.COMPONENTS;
        return new Vector(this.#positions[offset], this.#positions[offset + 1], this.#positions[offset + 2]);
    }

    #calculateNormal(a, b, c) {
        return b.subtract(a).cross(c.subtract(b)).normalize();
    }
}
