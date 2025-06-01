function getPathPackage(name) {
    return require.resolve(name)
}

module.exports = {
    getPathPackage
}
