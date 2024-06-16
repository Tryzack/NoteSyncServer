const resetKeys = {};

function getResetKeys() {
	return resetKeys;
}

function setResetKey(newKey, data) {
	resetKeys[newKey] = data;
}

function deleteResetKey(key) {
	delete resetKeys[key];
}

export { getResetKeys, setResetKey, deleteResetKey };
