Chaos Equations
=========================

Real time visualization and animation of dynamic chaos equations.

### Implementation

GUI is built with [React](https://reactjs.org/).

Visualizations are hardware accelerated and rendered with WebGL via the excellent [three.js](https://threejs.org/) library. As many as *400,000 individual points* are drawn on screen at any given time.

Using Parcel for the bundler because it's super fast and requires little configuration.

### Note to MacOS users

Run this project in Safari. It runs at least twice as fast as Chromium. Probably due to Mac-specific hardware/WebGL optimizations in Safari.

### Cloning this code

I recommend making a new folder and cloning the git repo direclty into that. Otherwise the `git clone` command will create a folder called 'git'.

Install the dependencies and then run the Parcel dev server on `http://localhost:1234`.

```
~ mkdir chaos-equations
~ cd chaos-equations
~ git clone https://api.glitch.com/chaos-equations/git .
~ npm install
~ npm run dev
```

When you want to build for production, use Parcel to bundle the project and then run the Node.js Express server which will serve static files from `/dist`.

```
~ npm run build
~ npm start
```

### Editing notes

If you remix this project on Glitch make sure to run `npm run build` from the Glitch console when you want to rebuild the project.

I mostly coded locally with VSCode and pushed to Glitch git repo. More info on this workflow [here](https://support.glitch.com/t/possible-to-code-locally-and-push-to-glitch-with-git/2704/3).

### Credits

Concept and calculation source code inspired by CodeParade. ([video](https://www.youtube.com/watch?v=fDSIRXmnVvk&vl=en)) ([repo](https://github.com/HackerPoet/Chaos-Equations))

Boilerplate remixed from [parcel-start](https://glitch.com/edit/#!/parcel-start). Thanks!

### About the author

I'm Jered. I'm a design technologist by trade and have a passion for creative coding, fractal art, and visualization.

Find me on [Stack Overflow](https://stackoverflow.com/users/4897779/jered) or [Github](https://github.com/jereddanielson), visit my [website](https://jered.io), or [drop me a line](mailto:jered@uw.edu)

Check out my other fun project from a while back: [Astronomy Picture of the Day 2.0](https://apod.jered.io)