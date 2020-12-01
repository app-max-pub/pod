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
		<div id='player'>
			<audio controls="controls">
				<!-- <source src="horse.ogg" type="audio/ogg"> -->
				<!-- <source src="https://open.live.bbc.co.uk/mediaselector/6/redir/version/2.0/mediaset/audio-nondrm-download-low/proto/https/vpid/p0902c0s.mp3" type="audio/mpeg"/> -->
				<source src="" type="audio/mpeg" />
				Your browser does not support the audio element.
			</audio>
		</div>
		<br />
		<xsl:for-each select='//item'>
			<card url='{*[starts-with(@url,"https:")]/@url}' on-tap='play'>
				<i>
					<xsl:value-of select='pubDate' />
				</i>
				<h3>
					<xsl:value-of select='title' />
				</h3>
				<p>
					<xsl:value-of select='description' />
				</p>
				<a>
					<xsl:value-of select='*[starts-with(@url,"https:")]/@url' />
				</a>
			</card>
		</xsl:for-each>
	</xsl:template>
		</xsl:stylesheet>
		`, 'text/xml');
const XSLP = new XSLTProcessor();
XSLP.importStylesheet(XSLT);
let STYLE = document.createElement('style');
STYLE.appendChild(document.createTextNode(`img {
		width: 100px;
	}
	a {
		color: gray;
		cursor: pointer;
	}
#player{
	position: fixed;
	bottom:0;
	background: #000;
	width: 50%;
	padding: 1rem;
}
	card {
		display: block;
		margin: 1rem;
		padding: 1rem;
		background: #333;
	}
	card:hover {
		background: #444;
		cursor: pointer;
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
};
class episode_list extends WebTag {
		async $onReady() {
			this.$data = await fetch(`https://podcasts.files.bbci.co.uk/p02nq0gn.rss`).then(x => x.text())
			console.log('data', this.$data)
		}
		play(node) {
			let url = node.getAttribute('url')
			console.log('play', url)
			let player = this.$view.Q('audio', 1);
			player.innerHTML = `<source src="${url}" type="audio/mpeg" />`;
			player.load()
			player.play();
		}
	}
window.customElements.define('episode-list', episode_list)