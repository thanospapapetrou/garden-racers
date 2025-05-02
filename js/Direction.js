'use strict';

const Direction = Object.freeze({
    N: (lat, long) => ({lat: lat + 1, long}),
    NE: (lat, long) => ({lat: lat + 1, long: long + 1}),
    E: (lat, long) => ({lat, long: long + 1}),
    SE: (lat, long) => ({lat: lat - 1, long: long + 1}),
    S: (lat, long) => ({lat: lat - 1, long}),
    SW: (lat, long) => ({lat: lat - 1, long: long - 1}),
    W: (lat, long) => ({lat, long: long - 1}),
    NW: (lat, long) => ({lat: lat + 1, long: long - 1}),
});
