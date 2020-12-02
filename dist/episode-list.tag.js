console.log('episode-list', import.meta.url);
export default class XML {
    static parse(string, type = 'text/xml') { // like JSON.parse
        return new DOMParser().parseFromString(string.replace(/xmlns=".*?"/g, ''), type)
    }
    static stringify(DOM) { // like JSON.stringify
        return new XMLSerializer().serializeToString(DOM).replace(/xmlns=".*?"/g, '')
    }
     static async fetch(url) {
        return XML.parse(await fetch(url).then(x => x.text()))
    }
    static tag(tagName, attributes){
        let tag = XML.parse(`<${tagName}/>`);
        for(let key in attributes) tag.firstChild.setAttribute(key,attributes[key]);
        return tag.firstChild;
    }
    static transform(xml, xsl, stringOutput = true) {
        let processor = new XSLTProcessor();
        processor.importStylesheet(typeof xsl == 'string' ? XML.parse(xsl) : xsl);
        let output = processor.transformToDocument(typeof xml == 'string' ? XML.parse(xml) : xml);
        return stringOutput ? XML.stringify(output) : output;
    }
}
XMLDocument.prototype.stringify = XML.stringify
Element.prototype.stringify = XML.stringify
const XSLT = new DOMParser().parseFromString(`<?xml version="1.0"?>
		<xsl:stylesheet version="1.0"  xmlns:xsl="http://www.w3.org/1999/XSL/Transform" >
		<xsl:template match='*'>
		<img src='{//channel/image/url}' />
		<h1>
			<xsl:value-of select='//channel/title' />
		</h1>
		<p>
			<xsl:value-of select='//channel/description' />
		</p>
		<table class='stripes'>
			<xsl:for-each select='//item'>
				<tr url='{*[starts-with(@url,"https:")]/@url}' on-tap='play'>
					<td class='date'>
						<time-format class='month' time='{pubDate}' format='MMM'></time-format>
						<time-format class='day' time='{pubDate}' format='DD'></time-format>
						<time-format class='year' time='{pubDate}' format='YYYY'></time-format>
						<!-- <div class='month'>NOV</div>
						<div class='day'>29</div>
						<div class='year'>2020</div> -->
					</td>
					<td>
						<h3>
							<xsl:value-of select='title' />
						</h3>
						<p>
							<xsl:value-of select='description' />
						</p>
					</td>
				</tr>
			</xsl:for-each>
		</table>
	</xsl:template>
		</xsl:stylesheet>
		`, 'text/xml');
const XSLP = new XSLTProcessor();
XSLP.importStylesheet(XSLT);
let STYLE = document.createElement('style');
STYLE.appendChild(document.createTextNode(`@import url('https://max.pub/css/base.css');
	@import url('https://max.pub/css/josefin.css');
	img {
		width: 100px;
	}
	p {
		font-size: 14px;
		text-align: justify;
		margin: .2em 0;
		padding: .2em 0;
	}
	h3 {
		margin: 0;
		padding: 0;
		font-size: 17px;
		font-weight: 300;
		text-align: justify;
	}
	.stripes tr:nth-child(2n) {
		background: #2a2a2a;
	}
	td {
		vertical-align: top;
		padding: .3rem
	}
	td:hover {
		background: var(--back-mark);
		cursor: pointer;
	}
	.date>* {
		font-weight: 100;
		text-align: center;
		color: silver;
		display: block;
	}
	.year {
		font-size: 10px;
	}
	.month {
		font-size: 11px;
		text-transform: uppercase;
	}
	.day {
		font-size: 22px;
	}`));
function QQ(query, i) {
	let result = Array.from(this.querySelectorAll(query));
	return i ? result?.[i - 1] : result;
}
Element.prototype.Q = QQ
ShadowRoot.prototype.Q = QQ
DocumentFragment.prototype.Q = QQ
class WebTag extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: 'open', delegatesFocus: true });
		this.shadowRoot.appendChild(STYLE.cloneNode(true)); //: CSS
		this.$HTM = document.createElement('htm')
		this.shadowRoot.appendChild(this.$HTM)
	}
	async connectedCallback() {
		this.$attachMutationObservers();
		this.$attachEventListeners();
		await this.$render() //: XSLT
		this.$onReady(); //: onReady
	}
	$attachMutationObservers() {
		this.modelObserver = new MutationObserver(events => {
			if ((events[0].type == 'attributes') && (events[0].target == this)) {
			} else {
				if (this.$autoUpdate !== false) this.$render(events); //: XSLT
			}
		}).observe(this, { attributes: true, characterData: true, attributeOldValue: true, childList: true, subtree: true });
	}
	$attachEventListeners() {
		let action = (event, key) => {
			try {
				let target = event.composedPath()[0];
				let action = target.closest(`[${key}]`);
				this[action.getAttribute(key)](action, event, target)
			}
			catch { }
		}
		this.addEventListener('click', e => action(e, 'on-tap')); //: onTap
	}
	$clear(R) {
		while (R.lastChild)
			R.removeChild(R.lastChild);
	}
	get $view() {
		return this.$HTM;
	}
	set $view(HTML) {
		this.$clear(this.$view);
		if (typeof HTML == 'string')
			HTML = new DOMParser().parseFromString(HTML, 'text/html').firstChild
		this.$view.appendChild(HTML);
	}
	get $data() {
		return this;
	}
	set $data(XML) {
		this.$clear(this.$data);
		if (typeof XML == 'string')
			XML = new DOMParser().parseFromString(XML, 'text/xml').firstChild
		this.appendChild(XML);
	}
	$render(events) {
		return new Promise((resolve, reject) => {
			window.requestAnimationFrame(t => {
				const t1 = new Date().getTime();
				let xml = new DOMParser().parseFromString(new XMLSerializer().serializeToString(this).replace(/xmlns=".*?"/g, ''), 'text/xml'); // some platforms need to reparse the xml
				let output = XSLP.transformToFragment(xml, document);
				this.$view = output;
				resolve()
			});
		});
	}
	$event(name, options) {
		console.log('send EVENT', name, options)
		this.dispatchEvent(new CustomEvent(name, {
			bubbles: true,
			composed: true,
			cancelable: true,
			detail: options
		}));
	}
};
const list = {
		bbc: `https://podcasts.files.bbci.co.uk/p02nq0gn.rss`, // bbc global news
		freu: `https://beste-freundinnen.podigee.io/feed/mp3`, // beste freundinnen
		handel: `https://handelsblatt-morningbriefing.podigee.io/feed/mp3`, // handelsblatt morning briefing
		eco: `https://www.economist.com/media/rss/economist.xml`, // economist
	}
	import 'https://max.pub/time/dist/time-format.tag.js'
	class episode_list extends WebTag {
		async $onReady() {
			let podcast = document.location.hash.slice(1) || 'bbc';
			console.log('load',podcast)
			this.$data = await fetch(list[podcast]).then(x => x.text())
			console.log('data', this.$data)
		}
		play(node) {
			let url = node.getAttribute('url')
			this.$event('play', { url })
		}
	}
window.customElements.define('episode-list', episode_list)