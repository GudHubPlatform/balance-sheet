import html from "./tabs.html";
import './tabs.scss';

class Tabs extends HTMLElement {

    constructor() {
        super();
        this.tabs = [];
    }

    async connectedCallback() {
        this.innerHTML = html;

        this.addTab({
            name: 'Оборотна-сальдова відомість',
            type: 'summary',
            data: null,
            active: true,
            closable: false
        });

        this.querySelector('.tabs').addEventListener('wheel', (e) => {
            e.preventDefault();
            this.querySelector('.tabs').style.scrollBehavior = 'auto';
            this.querySelector('.tabs').scrollLeft += (e.deltaY + e.deltaX);
        });

    }

    addTab(tab) {
        this.tabs.push(tab);

        const tabElement = document.createElement('div');
        tabElement.classList.add('tab');

        if (tab.active) {
            tabElement.classList.add('active');
        }

        tabElement.innerHTML = `<span class="name">${tab.name} ${tab.closable ? '<span class="close-tab"><svg clip-rule="evenodd" fill-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="m12 10.93 5.719-5.72c.146-.146.339-.219.531-.219.404 0 .75.324.75.749 0 .193-.073.385-.219.532l-5.72 5.719 5.719 5.719c.147.147.22.339.22.531 0 .427-.349.75-.75.75-.192 0-.385-.073-.531-.219l-5.719-5.719-5.719 5.719c-.146.146-.339.219-.531.219-.401 0-.75-.323-.75-.75 0-.192.073-.384.22-.531l5.719-5.719-5.72-5.719c-.146-.147-.219-.339-.219-.532 0-.425.346-.749.75-.749.192 0 .385.073.531.219z"/></svg></span>' : ''} </span>`;

        tabElement.addEventListener('click', () => {
            this.setActiveTab(tab);
        });

        if (tab.closable) {
            tabElement.querySelector('.close-tab').addEventListener('click', (event) => {
                event.stopPropagation();
                this.closeTab(tab);
            });
        }

        this.querySelector('.tabs').append(tabElement);

        tabElement.click();
    }

    setActiveTab(tab) {

        const activeTabElement = this.querySelector('.tab.active');

        if (activeTabElement) {
            activeTabElement.classList.remove('active');
        }

        this.querySelector(`.tab:nth-child(${this.tabs.findIndex(t => t.name === tab.name) + 1})`).classList.add('active');

        this.tabs.forEach(tab => {
            tab.active = false;
        });

        tab.active = true;

        const event = new CustomEvent('tabChange', {
            detail: tab
        });

        this.dispatchEvent(event);

    }

    closeTab(tab) {

        if (!tab.closable) {
            return;
        }

        const index = this.tabs.findIndex(t => t.name === tab.name);

        this.tabs.splice(index, 1);

        this.querySelector(`.tab:nth-child(${index + 1})`).remove();

        if (tab.active) {
            this.setActiveTab(this.tabs[0]);
        }

    }

}

if (!customElements.get('gh-balance-sheet-tabs')) {
    customElements.define('gh-balance-sheet-tabs', Tabs);
}