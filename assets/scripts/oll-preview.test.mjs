import assert from "node:assert/strict";
import {
	getOllPreviewPattern,
	invertAlgorithmString,
	normalizeAlgorithmString,
	parseAlgorithm,
	stringifyAlgorithm,
} from "./oll-preview.mjs";

const rotateUFaceClockwise = (face) => {
	const rotated = Array(9).fill(false);
	const mapping = [6, 3, 0, 7, 4, 1, 8, 5, 2];
	mapping.forEach((sourceIndex, targetIndex) => {
		rotated[targetIndex] = face[sourceIndex];
	});
	return rotated;
};

const rotatePatternY = (pattern) => ({
	U: rotateUFaceClockwise(pattern.U),
	F: pattern.R,
	R: pattern.B,
	B: pattern.L,
	L: pattern.F,
});

const roundTripAlgorithm = "(R U R' U')2 F R U R'";
const normalizedRoundTrip = normalizeAlgorithmString(roundTripAlgorithm);
const doubleInverted = invertAlgorithmString(invertAlgorithmString(roundTripAlgorithm));
assert.equal(
	doubleInverted,
	normalizedRoundTrip,
	"Double-inverted algorithm should match normalized input."
);

const repeated = "(R U R' U')2";
const expanded = "R U R' U' R U R' U'";
assert.equal(
	normalizeAlgorithmString(repeated),
	normalizeAlgorithmString(expanded),
	"Parenthesis repetition should expand correctly."
);

const identityPattern = getOllPreviewPattern("");
assert.ok(identityPattern.U.every(Boolean), "Identity pattern should keep U face yellow.");
assert.ok(identityPattern.F.every((value) => !value), "Identity pattern F row should be gray.");
assert.ok(identityPattern.R.every((value) => !value), "Identity pattern R row should be gray.");
assert.ok(identityPattern.B.every((value) => !value), "Identity pattern B row should be gray.");
assert.ok(identityPattern.L.every((value) => !value), "Identity pattern L row should be gray.");

const baseAlgorithm = "R U R' U'";
const rotatedAlgorithm = "y R U R' U' y'";
const basePattern = getOllPreviewPattern(baseAlgorithm);
const rotatedPattern = getOllPreviewPattern(rotatedAlgorithm);
assert.deepEqual(
	rotatedPattern,
	rotatePatternY(basePattern),
	"y rotations should shift side rows in the preview pattern."
);

const parsed = parseAlgorithm("Rw U2 M' (R U R' U')2");
assert.equal(
	stringifyAlgorithm(parsed),
	"r U2 M' R U R' U' R U R' U'",
	"Wide moves and grouped repetitions should normalize to expected sequence."
);

console.log("All oll-preview tests passed.");
