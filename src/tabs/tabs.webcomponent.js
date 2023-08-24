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
            active: true
        })

    }

    addTab(tab) {
        this.tabs.push(tab);

        const tabElement = document.createElement('div');
        tabElement.classList.add('tab');

        if(tab.active) {
            tabElement.classList.add('active');
        }

        tabElement.innerHTML = `<span class="name">${tab.name}</span>`;

        tabElement.addEventListener('click', () => {
            this.setActiveTab(tab);
        });

        this.querySelector('.tabs').append(tabElement);
    }

    setActiveTab(tab) {

        this.querySelector('.tab.active').classList.remove('active');

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

}

if(!customElements.get('gh-balance-sheet-tabs')) {
    customElements.define('gh-balance-sheet-tabs', Tabs);
}