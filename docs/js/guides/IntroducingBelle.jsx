import React, {Component} from 'react';
import {Card, Toggle} from 'belle';

export default class Why extends Component {

  render() {
    return (<div>

      <h2 style={ {marginTop: 0, marginBottom: 20} }>Introducing Belle</h2>

      <Card style={{ borderTop: '1px solid #f2f2f2' }}>
        <img src="images/overview.png"
             style={{ width: 490 }} />
      </Card>

      <p>
        Belle is a set of React components including Toggle, ComboBox, Rating, TextInput, Button, Card & Select. Many more like DatePicker, NumberInput, DropZone & Menu will come soon. As of today we hit version 1.0.0 :)
      </p>

      <h3 style={ {marginTop: 40, marginBottom: 20} }>Wait, but why yet another component library?</h3>

      <p>
        The web platform is a fantastic environment. Still it has certain limitations that are holding you back as a developer. React opened up new opportunities and I finally had tools in my hand to make the kind of UI components I always wanted to.
      </p>
      <p>Don't get me wrong. There are a ton of really great UI libraries out there like jQuery UI, Bootstrap, Polymer, you name it. They are super useful and to me often a source for inspiration. Through them I learned a lot about the details to take care of when developing user interface elements. Nevertheless always some feature was missing or the UX not as good as we imagined it. That’s why Jyoti & I started to research and explore building our own components. Quickly it became clear others might benefit from sharing our lessons learned and our endeavour shifted to creating Belle  - a set of configurable components with all these features included:
      </p>
      <ul>
        <li>Encapsulated components</li>
        <li>Mobile support built-in</li>
        <li>ARIA Support</li>
        <li>Customizable styles / themes (right now there is Belle & Bootstrap 3)</li>
        <li>Advanced localized styling for each individual component</li>
      </ul>

      <p>
        With Belle we aim to provide the best possible UX while making the components highly configurable to allow users applying their own theme. For demonstration purposes Belle comes with two themes (Belle, Bootstrap3) and we aim to add more like Elemental UI or Material Design soon.
      </p>

      <p>Let’s have a look at two of the components and walk you through some of the details we took care of.</p>

      <h3 style={{ marginBottom: 20}}>Let's see the Toggle for example</h3>

      <p>The handle can be grabbed and dragged on mobile as well as on desktop devices. In addition a
      simple click or tap initiates switching the state. Of course there is more to it. There are many small details like the possibility to slightly leave the toggle area while continuing to slide. Another one is preventing scrolling while the Toggle being active. All done to enhance the user experience.</p>

      <h4>On Mobile</h4>

      <img src="http://static.nikgraf.com/belle/why-belle/toggle-mobile.gif" style={{ width: 366, height: 270 }} />

      <h4>On Mobile with Bootstrap Style</h4>

      <img src="http://static.nikgraf.com/belle/why-belle/toggle-bootstrap.gif" style={{ width: 372, height: 268 }} />

      <h4>With custom Styles</h4>

      <img src="http://static.nikgraf.com/belle/why-belle/toggle-desktop.gif" style={{ width: 97, height: 62 }} />
      <br />
      Try it yourself here:
      <br /><br />
      <Toggle defaultValue style={{ marginLeft: 12 }}/>

      <h3>Let's checkout the Select next</h3>

      <p>
        Its appearance can be modified while it will continue to work well on mobile & desktop devices. See the last example with a Bootstrap variation of the Select component.
      </p>

      <img src="http://static.nikgraf.com/belle/why-belle/select-dektop.gif" style={{ height: 332 }} />

      <h4>Select on Mobile</h4>

      <img src="http://static.nikgraf.com/belle/why-belle/select-mobile.gif" style={{ height: 270 }} />

      <h4>Select with Bootstrap style</h4>
      <img src="http://static.nikgraf.com/belle/why-belle/select-desktop-bootstrap.gif" style={{ height: 280 }} />
      <br />
      <br />

      <p>
        In case we caught your interest please reach out to us via Twitter
         <a href="https://twitter.com/nikgraf"> @nikgraf</a> &
         <a href="https://twitter.com/jyo_pur"> @jyo_pur</a> or mail us at
        <a href="mailto:nik@nikgraf.com?cc=jyotipuri@gmail.com "> nik@nikgraf.com & jyotipuri@gmail.com</a>.
        We look forward to your feedback.
      </p>
      <p>
        As we want to release Belle soon and we could also use your help in promoting it. Please help us sharing.
      </p>

    </div>);
  }
}