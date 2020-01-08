module.exports.compactName = (arr) => {
    arr.map(el => {
        el.name = el.name.slice(14)
        return el
    })
    return arr
}