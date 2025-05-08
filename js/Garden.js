'use strict';

class Garden {
    static #ATTRIBUTES = ['position', 'normal', 'textureCoordinates'];
    static #SHADER_FRAGMENT = './glsl/garden.frag';
    static #SHADER_VERTEX = './glsl/garden.vert';
    static #UNIFORMS = {
        projection: (gl, uniform, projection) => gl.uniformMatrix4fv(uniform, false, projection),
        camera: (gl, uniform, camera) => gl.uniformMatrix4fv(uniform, false, camera),
        model: (gl, uniform, model) => gl.uniformMatrix4fv(uniform, false, model),
        terrain: (gl, uniform, texture) => {
            gl.activeTexture(gl.TEXTURE0 + 0); // TODO store offset in texture
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.uniform1i(uniform, 0); // TODO unbind texture
        },
        light: {
            ambient: (gl, uniform, color) => gl.uniform3fv(uniform, color),
            directional: {
                color: (gl, uniform, color) => gl.uniform3fv(uniform, color),
                direction: (gl, uniform, direction) => gl.uniform3fv(uniform, direction)
            }
        }
    };

    #garden;
    #terrain;
    #positions;
    #normals;
    #textureCoordinates;
    #indices;
    #task;

    constructor(gl, url) {
        return (async () => {
            this.#garden = await(await GardenRacers.load(url)).json();
            this.#terrain = new Texture(gl, './img/f-texture.png');
            this.#positions = this.#calculatePositions();
            this.#normals = this.#calculateNormals();
            this.#textureCoordinates = this.#calculateTextureCoordinates();
            this.#indices = this.#calculateIndices();
            this.#task = new RenderingTask(gl, await new Renderer(gl, Garden.#SHADER_VERTEX, Garden.#SHADER_FRAGMENT,
                    Garden.#UNIFORMS, Garden.#ATTRIBUTES), {
                        position: new AttributeData(gl, this.#positions),
                        normal: new AttributeData(gl, this.#normals),
                        textureCoordinates: new AttributeData(gl, this.#textureCoordinates)
                    }, new IndexData(gl, this.#indices));
            return this;
        })();
    }

    render(projection, camera, model, light) {
        this.#task.render({projection, camera, model, terrain: this.#terrain.texture, light});
    }

    #calculatePositions() {
        const positions = [];
        for (let latitude = 0; latitude < 2 * this.#garden.latitude + 1; latitude++) {
            for (let longitude = 0; longitude < 2 * this.#garden.longitude + 1; longitude++) {
                const lat = Math.floor((latitude - 1) / 2);
                const long = Math.floor((longitude - 1) / 2);
                let altitude = 0.0;
                if ((latitude % 2 == 1) && (longitude % 2 == 1)) { // between parallels and between meridians; altitude
                    altitude = this.#getAltitude(lat, long);
                } else if (latitude % 2 == 1) { // between parallels and on meridian; average east and west
                    altitude = (this.#getAltitude(lat, long + 1) + this.#getAltitude(lat, long)) / 2.0;
                } else if (longitude % 2 == 1) { // on parallel between meridians; average north and south
                    altitude = (this.#getAltitude(lat + 1, long) + this.#getAltitude(lat, long)) / 2.0;
                } else { // on parallel and on meridian; average all directions
                    altitude = (this.#getAltitude(lat + 1, long + 1) + this.#getAltitude(lat, long + 1)
                            + this.#getAltitude(lat, long) + this.#getAltitude(lat + 1, long)) / 4.0;
                }
                positions.push(longitude / 2.0, latitude / 2.0, altitude);
            }
        }
        return positions;
    }

    #calculateNormals() {
        const normals = [];
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
                normals.push(normal.x, normal.y, normal.z);
            }
        }
        return normals;
    }

    #calculateTextureCoordinates() {
        const textureCoordinates = [];
        for (let latitude = 0; latitude < 2 * this.#garden.latitude + 1; latitude++) {
            for (let longitude = 0; longitude < 2 * this.#garden.longitude + 1; longitude++) {
                // TODO
                textureCoordinates.push(latitude % 2, longitude % 2, 0.0);
            }
        }
        return textureCoordinates;
    }

    #calculateIndices() {
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

    #getAltitude(latitude, longitude) {
        return this.#garden.altitudes[Math.min(Math.max(latitude, 0), this.#garden.latitude - 1) * this.#garden.longitude
                + Math.min(Math.max(longitude, 0), this.#garden.longitude - 1)];
    }

    #getPosition(latitude, longitude) {
        return new Vector(longitude / 2, latitude / 2,
                this.#positions[(Math.min(Math.max(latitude, 0), 2 * this.#garden.latitude)
                * (2 * this.#garden.longitude + 1) + Math.min(Math.max(longitude, 0), 2 * this.#garden.longitude))
                * Vector.COMPONENTS + 2]);
    }

    #calculateNormal(a, b, c) {
        return b.subtract(a).cross(c.subtract(b)).normalize();
    }
}
