'use strict';

class Garden {
    static #ATTRIBUTES = ['position', 'normal', 'textureCoordinatesCenter', 'textureCoordinatesN',
            'textureCoordinatesNE', 'textureCoordinatesE', 'textureCoordinatesSE', 'textureCoordinatesS',
            'textureCoordinatesSW', 'textureCoordinatesW', 'textureCoordinatesNW'];
    static #IMAGE_TERRAINS = './img/terrains.png';
    static #SHADER_FRAGMENT = './glsl/garden.frag';
    static #SHADER_VERTEX = './glsl/garden.vert';
    static #STEP_LATTICE = 0.5;
    static #STEP_TEXTURE = 0.25;
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
        },
        terrains: (gl, uniform, terrains) => gl.uniform1i(uniform, terrains.unit - gl.TEXTURE0)
    };

    #garden;
    #positionLattice;
    #normalLattice;
    #task;

    // TODO include nulls for center in loops

    constructor(gl, url) {
        return (async () => {
            this.#garden = await(await GardenRacers.load(url)).json();
            this.#positionLattice = this.#calculatePositionLattice();
            this.#normalLattice = this.#calculateNormalLattice();
            const renderer = await new Renderer(gl, Garden.#SHADER_VERTEX, Garden.#SHADER_FRAGMENT, Garden.#UNIFORMS,
                    Garden.#ATTRIBUTES);
            renderer.uniforms.terrains = await new Texture(gl, gl.TEXTURE0, Garden.#IMAGE_TERRAINS);
            this.#task = new RenderingTask(gl, renderer, {
                        position: new AttributeData(gl, this.#positions),
                        normal: new AttributeData(gl, this.#normals),
                        textureCoordinatesCenter: new AttributeData(gl, this.#getTextureCoordinates(null)),
                        textureCoordinatesN: new AttributeData(gl, this.#getTextureCoordinates(Direction.N)),
                        textureCoordinatesNE: new AttributeData(gl, this.#getTextureCoordinates(Direction.NE)),
                        textureCoordinatesE: new AttributeData(gl, this.#getTextureCoordinates(Direction.E)),
                        textureCoordinatesSE: new AttributeData(gl, this.#getTextureCoordinates(Direction.SE)),
                        textureCoordinatesS: new AttributeData(gl, this.#getTextureCoordinates(Direction.S)),
                        textureCoordinatesSW: new AttributeData(gl, this.#getTextureCoordinates(Direction.SW)),
                        textureCoordinatesW: new AttributeData(gl, this.#getTextureCoordinates(Direction.W)),
                        textureCoordinatesNW: new AttributeData(gl, this.#getTextureCoordinates(Direction.NW))

                    }, new IndexData(gl, this.#indices));
            return this;
        })();
    }

    render(projection, camera, model, light) {
        this.#task.render({projection, camera, model, light}); // TODO do not set all here
    }

    get #positions() {
        const positions = [];
        for (let latitude = 0; latitude < this.#garden.latitude; latitude++) {
            for (let longitude = 0; longitude < this.#garden.longitude; longitude++) {
                const lat = 2 * latitude + 1;
                const lng = 2 * longitude + 1;
                const position = this.#getPosition(lat, lng);
                positions.push(position.x, position.y, position.z);
                for (let direction of Object.values(Direction)) {
                    const position = this.#getPosition(lat + direction.lat, lng + direction.lng);
                    positions.push(position.x, position.y, position.z);
                }
            }
        }
        return positions;
    }

    get #normals() {
        const normals = [];
        for (let latitude = 0; latitude < this.#garden.latitude; latitude++) {
            for (let longitude = 0; longitude < this.#garden.longitude; longitude++) {
                const lat = 2 * latitude + 1;
                const lng = 2 * longitude + 1;
                const normal = this.#getNormal(lat, lng);
                normals.push(normal.x, normal.y, normal.z);
                for (let direction of Object.values(Direction)) {
                    const normal = this.#getNormal(lat + direction.lat, lng + direction.lng);
                    normals.push(normal.x, normal.y, normal.z);
                }
            }
        }
        return normals;
    }

    get #indices() {
        const indices = [];
        for (let latitude = 0; latitude < this.#garden.latitude; latitude++) {
            for (let longitude = 0; longitude < this.#garden.longitude; longitude++) {
                for (let direction = 0; direction < Object.keys(Direction).length; direction++) {
                    const next = (direction + 1) % Object.keys(Direction).length;
                    const offset = latitude * this.#garden.longitude * (Object.keys(Direction).length + 1)
                            + longitude * (Object.keys(Direction).length + 1);
                    indices.push(offset + direction + 1, offset, offset + next + 1);
                }
            }
        }
        return indices;
    }

    #calculatePositionLattice() {
        const lattice = [];
        for (let latitude = 0; latitude < 2 * this.#garden.latitude + 1; latitude++) {
            lattice[latitude] = [];
            for (let longitude = 0; longitude < 2 * this.#garden.longitude + 1; longitude++) {
                const lat = Math.floor((latitude - 1) / 2);
                const lng = Math.floor((longitude - 1) / 2);
                let altitude = 0.0; // TODO use directions
                if ((latitude % 2 == 1) && (longitude % 2 == 1)) { // between parallels and between meridians; altitude
                    altitude = this.#getAltitude(lat, lng);
                } else if (latitude % 2 == 1) { // between parallels and on meridian; average east and west
                    altitude = (this.#getAltitude(lat, lng + 1)
                            + this.#getAltitude(lat, lng)) / 2.0;
                } else if (longitude % 2 == 1) { // on parallel between meridians; average north and south
                    altitude = (this.#getAltitude(lat + 1, lng)
                            + this.#getAltitude(lat, lng)) / 2.0;
                } else { // on parallel and on meridian; average all directions
                    altitude = (this.#getAltitude(lat + 1, lng + 1)
                            + this.#getAltitude(lat, lng + 1)
                            + this.#getAltitude(lat, lng)
                            + this.#getAltitude(lat + 1, lng)) / 4.0;
                }
                lattice[latitude][longitude] = new Vector(Garden.#STEP_LATTICE * longitude,
                        Garden.#STEP_LATTICE * latitude, altitude);
            }
        }
        return lattice;
    }

    #calculateNormalLattice() {
        const lattice = [];
        for (let latitude = 0; latitude < 2 * this.#garden.latitude + 1; latitude++) {
            lattice[latitude] = [];
            for (let longitude = 0; longitude < 2 * this.#garden.longitude + 1; longitude++) {
                const positions = [];
                positions[null] = this.#getPosition(latitude, longitude);
                for (let direction of Object.keys(Direction)) {
                    positions[direction] = this.#getPosition(latitude + Direction[direction].lat,
                            longitude + Direction[direction].lng);
                }
                const step = ((latitude % 2 == 1) ^ (longitude % 2 == 1)) ? 2 : 1;
                let normal = new Vector(0.0, 0.0, 0.0);
                for (let direction = 0; direction < Object.keys(Direction).length; direction += step) {
                    const dir = Object.keys(Direction)[direction];
                    const next = Object.keys(Direction)[(direction + step) % Object.keys(Direction).length];
                    normal = normal.add(this.#calculateNormal(positions[dir], positions[null], positions[next]));
                }
                lattice[latitude][longitude] = normal.normalize();
            }
        }
        return lattice;
    }

    #getTextureCoordinates(direction) {
        const coordinates = [];
        for (let latitude = 0; latitude < this.#garden.latitude; latitude++) {
            for (let longitude = 0; longitude < this.#garden.longitude; longitude++) {
                for (let dir of [null, ...Object.values(Direction)]) {
                    let s = (this.#getTerrain(latitude + (direction?.lat ?? 0), longitude + (direction?.lng ?? 0))
                            + Garden.#STEP_LATTICE + ((dir?.lng ?? 0) - 2 * (direction?.lng ?? 0))
                            * Garden.#STEP_TEXTURE) / Object.keys(Terrain).length;
                    let t = Garden.#STEP_LATTICE - ((dir?.lat ?? 0) + 2 * (direction?.lat ?? 0)) * Garden.#STEP_TEXTURE;
                    let p = Math.max(2 - Math.sqrt(Math.pow((dir?.lng ?? 0) - 2 * (direction?.lng ?? 0), 2) +
                            Math.pow((dir?.lat ?? 0) - 2 * (direction?.lat ?? 0), 2)), 0.0);
                    coordinates.push(s, t, p);
                }
            }
        }
        return coordinates;
    }

    #getAltitude(latitude, longitude) {
        const lat = this.#garden.latitude - Math.min(Math.max(latitude, 0), this.#garden.latitude - 1) - 1;
        const lng = Math.min(Math.max(longitude, 0), this.#garden.longitude - 1);
        return this.#garden.altitudes[lat * this.#garden.longitude + lng];
    }

    #getTerrain(latitude, longitude) {
        const lat = this.#garden.latitude - Math.min(Math.max(latitude, 0), this.#garden.latitude - 1) - 1;
        const lng = Math.min(Math.max(longitude, 0), this.#garden.longitude - 1);
        return Terrain[this.#garden.terrains[lat * this.#garden.longitude + lng]];
    }

    #getPosition(latitude, longitude) {
        const lat = Math.min(Math.max(latitude, 0), 2 * this.#garden.latitude);
        const lng = Math.min(Math.max(longitude, 0), 2 * this.#garden.longitude);
        return new Vector(Garden.#STEP_LATTICE * longitude, Garden.#STEP_LATTICE * latitude,
                this.#positionLattice[lat][lng].z);
    }

    #getNormal(latitude, longitude) {
        const lat = Math.min(Math.max(latitude, 0), 2 * this.#garden.latitude);
        const lng = Math.min(Math.max(longitude, 0), 2 * this.#garden.longitude);
        return this.#normalLattice[lat][lng];
    }

    #calculateNormal(a, b, c) {
        return b.subtract(a).cross(c.subtract(b)).normalize();
    }
}
