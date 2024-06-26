import {getHSIFutSeries, getRefs} from "../scripts/hsifut.js"

var html = '<table>'
try {
	const res = await getHSIFutSeries()
	for (var k in res) {
		html += '<tr><td class="ref-name"><a href="' + res[k].link + '" target="_blank">' + k + '</a></td><td class="price">' + res[k].price + '</td></tr>'
	}
} catch (e) {
	html += '<pre><tr><td class="ref-name">' + e + '</pre></td></tr>'
}
html += '</table>'

document.getElementById('result').innerHTML = html
document.getElementById('result-dt').innerText = "Update: " + new Date().toString().substring(16, 31)

var ref = '<span>'
const refs = getRefs()
for (var l of refs) {
	ref += '<a href="' + l + '" target="_blank" title="' + l + '">&#128279;</a> '
}
ref += '</span>'
document.getElementById('ref').innerHTML = ref