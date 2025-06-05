'use strict';

class RoundedCylinder {
    #radius;
    #height;
    #sectors;
    #stacks;

    constructor(radius, height, sectors, stacks) {
        this.#radius = radius;
        this.#height = height;
        this.#sectors = sectors;
        this.#stacks = stacks;
    }

    get positions() {
        const positions = [0.0, 0.0, 0.0];
        for (let i = -Math.PI / 2 * (1 - 1 / this.#stacks); i <= 0; i += Math.PI / 2 / this.#stacks) {
            for (let j = 0; j < 2 * Math.PI; j += 2 * Math.PI / this.#sectors) {
                positions.push(Math.cos(i) * Math.cos(j) * this.#radius,
                        Math.cos(i) * Math.sin(j) * this.#radius,
                        (1 + Math.sin(i)) * this.#radius);
            }
        }
        for (let i = 0.0; i < Math.PI / 2; i += Math.PI / 2 / this.#stacks) {
            for (let j = 0; j < 2 * Math.PI; j += 2 * Math.PI / this.#sectors) {
                positions.push(Math.cos(i) * Math.cos(j) * this.#radius,
                        Math.cos(i) * Math.sin(j) * this.#radius,
                        (Math.sin(i) - 1) * this.#radius + this.#height);
            }
        }
        positions.push(0.0, 0.0, this.#height);
        return positions;
    }

    get normals() {
        const normals = [0.0, 0.0, -1.0];
        for (let i = -Math.PI / 2 * (1 - 1 / this.#stacks); i <= 0; i += Math.PI / 2 / this.#stacks) {
            for (let j = 0; j < 2 * Math.PI; j += 2 * Math.PI / this.#sectors) {
                normals.push(Math.cos(i) * Math.cos(j),
                        Math.cos(i) * Math.sin(j),
                        Math.sin(i));
            }
        }
        for (let i = 0.0; i < Math.PI / 2; i += Math.PI / 2 / this.#stacks) {
            for (let j = 0; j < 2 * Math.PI; j += 2 * Math.PI / this.#sectors) {
                normals.push(Math.cos(i) * Math.cos(j),
                        Math.cos(i) * Math.sin(j),
                        Math.sin(i));
            }
        }
        normals.push(0.0, 0.0, 1.0);
        return normals;
    }

    get indices() {
        const indices = [];
        for (let i = 0; i < this.#sectors; i++) {
            indices.push(i + 1, 0, (i + 1) % this.#sectors + 1);
        }
        for (let i = 0; i < this.#stacks - 1; i++) {
            for (let j = 0; j < this.#sectors; j++) {
                indices.push(i * this.#sectors + (j + 1) % this.#sectors + 1,
                        (i + 1) * this.#sectors + (j + 1) % this.#sectors + 1,
                        (i + 1) * this.#sectors + j + 1);
                indices.push((i + 1) * this.#sectors + j + 1,
                        i * this.#sectors + j + 1,
                        i * this.#sectors + (j + 1) % this.#sectors + 1);
            }
        }
        for (let i = 0; i < this.#sectors; i++) {
            indices.push((this.#stacks - 1) * this.#sectors + (i + 1) % this.#sectors + 1,
                    this.#stacks * this.#sectors + (i + 1) % this.#sectors + 1,
                    this.#stacks * this.#sectors + i + 1);
            indices.push(this.#stacks * this.#sectors + i + 1,
                    (this.#stacks - 1) * this.#sectors + i + 1,
                    (this.#stacks - 1) * this.#sectors + (i + 1) % this.#sectors + 1);
        }
        for (let i = 0; i < this.#stacks - 1; i++) {
            for (let j = 0; j < this.#sectors; j++) {
                indices.push((i + this.#stacks) * this.#sectors + (j + 1) % this.#sectors + 1,
                        (i + this.#stacks + 1) * this.#sectors + (j + 1) % this.#sectors + 1,
                        (i + this.#stacks + 1) * this.#sectors + j + 1);
                indices.push((i + this.#stacks + 1) * this.#sectors + j + 1,
                        (i + this.#stacks) * this.#sectors + j + 1,
                        (i + this.#stacks) * this.#sectors + (j + 1) % this.#sectors + 1);
            }
        }
        for (let i = 0; i < this.#sectors; i++) {
            indices.push((2 * this.#stacks - 1) * this.#sectors + (i + 1) % this.#sectors + 1,
                    2 * this.#stacks * this.#sectors + 1,
                    (2 * this.#stacks - 1) * this.#sectors + i + 1);
        }
        return indices;
    }
}
