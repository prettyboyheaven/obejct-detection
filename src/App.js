import React, { Component } from 'react';
import Konva from 'konva';
import './App.css';

class App extends Component {
  state = {
    isDrawing: false,
    startDrawingPositionX: null,
    startDrawingPositionY: null
  };

  stage;
  layer;
  rect;
  group;

  componentDidMount() {
    this.stage = new Konva.Stage({
      container: 'container',
      width: window.innerWidth,
      height: window.innerHeight
    });


    this.layer = new Konva.Layer();

    this.stage.on('mousedown', (e) => {
      this.setState({
        isDrawing: true,
        startDrawingPositionX: e.evt.pageX,
        startDrawingPositionY: e.evt.pageY,
      });

      this.group = new Konva.Group({
        x: e.evt.pageX,
        y: e.evt.pageY,
        // draggable: true
      });

      this.rect = new Konva.Rect({
        x: e.evt.pageX,
        y: e.evt.pageY,
        width: 0,
        height: 0,
        fill: 'rgba(0, 0, 0, 0.3)',
        stroke: 'black',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        strokeWidth: 2
      });

      this.group.add(this.rect);
      this.layer.add(this.group);
      this.group.draw();
    });

    this.stage.on('mousemove', (e) => {
      if(!this.state.isDrawing) {
        return
      }

      this.rect.attrs.width = e.evt.pageX - this.state.startDrawingPositionX;
      this.rect.attrs.height = e.evt.pageY - this.state.startDrawingPositionY;

      this.layer.draw();
    });
    this.stage.on('mouseup', () => {
      this.setState({
        isDrawing: false,
        startDrawingPositionX: null,
        startDrawingPositionY: null,
      })
    });

    this.stage.add(this.layer);
  }

  // handleMouseDown = (e) => {
  //   e.persist();
  //
  //   this.setState({
  //     isDrawing: true,
  //     startDrawingPositionX: e.pageX,
  //     startDrawingPositionY: e.pageY,
  //   });
  //
  //   this.group = new Konva.Group({
  //     x: e.pageX,
  //     y: e.pageY,
  //     draggable: true
  //   });
  //
  //   this.rect = new Konva.Rect({
  //     x: e.pageX,
  //     y: e.pageY,
  //     width: 0,
  //     height: 0,
  //     fill: 'rgba(0, 0, 0, 0.3)',
  //     stroke: 'black',
  //     position: 'relative',
  //     overflow: 'hidden',
  //     cursor: 'pointer',
  //     strokeWidth: 4
  //   });
  //
  //   this.group.add(this.rect);
  //   this.layer.add(this.group);
  //   this.group.draw();
  //
  // };
  //
  // handleMouseMove = (e) => {
  //   if(!this.state.isDrawing) {
  //     return
  //   }
  //   e.persist();
  //   e.stopPropagation();
  //
  //   this.rect.attrs.width = e.pageX - this.state.startDrawingPositionX;
  //   this.rect.attrs.height = e.pageY - this.state.startDrawingPositionY;
  //
  //   this.layer.draw();
  //
  // };

  // handleMouseUp = () => {
  //   const crossImageObj = new Image();
  //   crossImageObj.onload = () => {
  //     const cross = new Konva.Image({
  //       image: crossImageObj,
  //       x: 20,
  //       y: 20,
  //       width: 50,
  //       height: 50,
  //     });
  //
  //     cross.on('click', () => {
  //       alert('click');
  //       this.stage.remove(this.group);
  //     });
  //
  //     /* adding images to layer */
  //     this.group.add(cross);
  //     this.layer.draw();
  //   };
  //
  //   crossImageObj.src = 'https://pp.userapi.com/c845018/v845018528/121318/eaGeeQDWigE.jpg';
  //
  //   this.setState({
  //     isDrawing: false,
  //     startDrawingPositionX: null,
  //     startDrawingPositionY: null,
  //   })
  // };

  render() {


    return (
        <div id='container'
             // onMouseDown={ (e) => this.handleMouseDown(e) }
             // onMouseMove={ this.handleMouseMove }
             // onMouseUp={ this.handleMouseUp }
        >

        </div>
    );
  }
}

export default App;
