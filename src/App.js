import React, { Component } from 'react';
import Konva from 'konva';
import './App.css';
import multiply from './multiply.svg';

const image = 'https://pp.userapi.com/c837338/v837338962/4186/dMDirqdiCMY.jpg';

const reverse = (r1, r2) => {
  let r1x = r1.x, r1y = r1.y, r2x = r2.x,  r2y = r2.y, d;
  if (r1x > r2x ){
    d = Math.abs(r1x - r2x);
    r1x = r2x; r2x = r1x + d;
  }
  if (r1y > r2y ){
    d = Math.abs(r1y - r2y);
    r1y = r2y; r2y = r1y + d;
  }
  return ({x1: r1x, y1: r1y, x2: r2x, y2: r2y}); // return the corrected rect.
};

const updateDrag = (posNow, posStart, group, rect, layer) => {
  // update rubber rect position
  let posRect = reverse(posStart, posNow);
  group.x(posRect.x1);
  group.y(posRect.y1);
  rect.width(posRect.x2 - posRect.x1);
  rect.height(posRect.y2 - posRect.y1);
  rect.visible(true);
  layer.draw();
};

class App extends Component {
  state = {
    canvasHeight: 450,
    canvasWidth: 700,
    isDrawing: false,
    startDrawingPositionX: null,
    startDrawingPositionY: null,
    groups: [],
    ratio: null,
    scale: null,
    naturalScale: null,
    cords: [{width: 0, height: 0, x: 0, y: 0}]
  };

  stage;
  layer;
  rect;
  group;
  drawingGroup;
  imageToDetect;
  crossImage;

  componentDidMount() {
    const { canvasHeight, canvasWidth } = this.state;

    // создаем Stage - канвас, для рисования
    this.stage = new Konva.Stage({
      container: 'container',
      width: canvasWidth,
      height: canvasHeight,
    });

    this.layer = new Konva.Layer();

    // доавбляем изображение для модерации
    const imageObj = new Image();
    imageObj.onload = (e) => {

      const imageNaturalHeight = e.target.naturalHeight;
      const imageNaturalWidth = e.target.naturalWidth;

      // расчитываем необходимый ресайз изображения под канвас
      const imageSize = this.calculateAspectRatioFit(imageNaturalWidth, imageNaturalHeight, canvasWidth, canvasHeight);

      // расчитываем скейл для позиционирования по центру
      this.calculateScale(imageSize.width, imageSize.height);
      const left = imageSize.width * this.state.scale;
      const top = imageSize.height * this.state.scale;

      this.setState({
         shiftX: canvasWidth / 2 -  left / 2,
         shiftY: canvasHeight / 2 - top / 2,
      });

      const { shiftX, shiftY } = this.state;

      // добавляем изображения
      this.imageToDetect = new Konva.Image({
        x: shiftX,
        y: shiftY,
        image: imageObj,
        width: imageSize.width,
        height: imageSize.height,
      });

//  в будущем необходимый код для ротейта изображения
//  imageToDetect.offsetX(imageToDetect.width() / 2);
//  imageToDetect.offsetY(imageToDetect.height() / 2);

//  imageToDetect.x(imageToDetect.x() + imageToDetect.width() / 2);
//  imageToDetect.y(imageToDetect.y() + imageToDetect.height() / 2);
//
//  imageToDetect.rotation(90);


      // обновляем леер
      this.layer.add(this.imageToDetect);
      this.layer.draw();
    };
    imageObj.src = image;

    // Удаляем трансофрме со стейджа, по клику в любое место, кроме ректа
    this.stage.on('click',  (e) => {
      if ( e.target.hasName('rect')) {
        return
      }

      this.stage.find('Transformer').destroy();
      this.layer.draw();
    });

    this.stage.on('mousedown', (e) => {
      console.log(e.target);

      if ( e.target.hasName('rect') ) {
        return
      }

      const { evt: { layerX, layerY } } = e;
      const { attrs: imageToDetectAttrs } = this.imageToDetect;

      const imageToDetectX1 = imageToDetectAttrs.x;
      const imageToDetectX2 = imageToDetectAttrs.x + imageToDetectAttrs.width;
      const imageToDetectY1 = imageToDetectAttrs.y;
      const imageToDetectY2 = imageToDetectAttrs.y + imageToDetectAttrs.height;

      // если кликаем за областью фотокарточки, то не даем пользователю рисовать
      // слева по х
      if (layerX < imageToDetectX1) {
        return
      }

      // справа по х
      if (layerX > imageToDetectX2) {
        return
      }

      // сверху по у
      if (imageToDetectY1 > layerY) {
        return
      }

      // снизу по у
      if (imageToDetectY2 < layerY) {
        return
      }

      this.setState({
        isDrawing: true,
        startDrawingPositionX: e.evt.layerX,
        startDrawingPositionY: e.evt.layerY,
      });

      // создаем группу, в которой хранится рект и иконка удаления
      // this.group = new Konva.Group({
      //   x: e.evt.layerX,
      //   y: e.evt.layerY,
      //   draggable: true,
      //   name: 'group',
      // });

      this.drawingGroup = new Konva.Group({
        x: e.evt.layerX,
        y: e.evt.layerY,
        draggable: true,
        name: 'DrawingGroup',
      });

      this.group = new Konva.Group({
        x: e.evt.layerX,
        y: e.evt.layerY,
        draggable: false,
        position: 'relative'
      }).add(this.drawingGroup);

      this.group.on('dragmove', (e) => {
        const currentGroup = e.currentTarget;

        const currentDrawingGroup = currentGroup.getChildren(function(node) {
          return node.getClassName() === 'Group';
        })[0];

        console.log(currentDrawingGroup);

        const rect = currentDrawingGroup.getChildren(function(node) {
          return node.getClassName() === 'Rect'
        })[0];

        console.log(rect);


        const { scaleX, scaleY } = currentDrawingGroup.attrs;

        const rectWidth = rect.attrs.width * scaleX;
        const rectHeight = rect.attrs.height * scaleY;

        const groupPositionX = currentDrawingGroup.attrs.x;
        const groupPositionY = currentDrawingGroup.attrs.y;

        const { attrs: imageToDetectAttrs } = this.imageToDetect;
        const imageToDetectX1 = imageToDetectAttrs.x;
        const imageToDetectX2 = imageToDetectAttrs.x + imageToDetectAttrs.width;
        const imageToDetectY1 = imageToDetectAttrs.y;
        const imageToDetectY2 = imageToDetectAttrs.y + imageToDetectAttrs.height;

        // для запрета сдвига в право
        const sumX = groupPositionX + rectWidth;

        // для запрета сдвига вниз
        const sumY = groupPositionY + rectHeight;

        // запрет выхода за правый край по Х
        if ( sumX >= imageToDetectX2) {
          currentDrawingGroup.attrs.x = imageToDetectX2 - rectWidth;
        }

        // запрет выхода за левый край по Х
        if (groupPositionX <= imageToDetectX1) {
          currentDrawingGroup.attrs.x = imageToDetectX1;
        }

        // запрет выхода наверх по Y
        if (groupPositionY  < imageToDetectY1) {
          currentDrawingGroup.attrs.y = imageToDetectY1;
        }

        // запрет выходна вниз по Y
        if ( sumY >= imageToDetectY2 ) {
          currentDrawingGroup.attrs.y = imageToDetectY2 - rectHeight;
        }

      });

      this.rect = new Konva.Rect({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        fill: 'rgba(255, 255, 255, 0.7)',
        stroke: 'black',
        overflow: 'hidden',
        cursor: 'pointer',
        strokeWidth: 1,
        name: 'rect'
      });

      this.layer.draw();

      this.setState({
        groups: [...this.state.groups, this.drawingGroup]
      });

      // добавляем событие удаления только по клику на иконку крестика
      this.state.groups.forEach(item => item.on('click', (e) => {
        this.stage.find('Transformer').destroy();
        if (!e.target.attrs.image) {

          const currentGroup = this.state.groups.filter(groupItem => groupItem._id === e.target.parent._id)[0];
          const minHeight = 20;
          const minWidth = 20;

          const transformer = new Konva.Transformer({
            node: currentGroup,
            rotateEnabled: false,
            keepRatio: true,
            borderEnabled: true,
            enabledAnchors: [
                'top-left',
                'top-center',
                'top-right',
                'middle-right',
                'middle-left',
                'bottom-left',
                'bottom-center',
                'bottom-right'
            ],
            boundBoxFunc: function(oldBoundBox, newBoundBox) {
              if (newBoundBox.width < minWidth) {
                newBoundBox.width = minWidth;
              }

              if (newBoundBox.height < minHeight) {
                newBoundBox.height = minHeight;
              }

              return newBoundBox;
            }
          });

          currentGroup.on('transform', function (e) {
            const crossImageGroup = e.currentTarget.parent.getChildren(function(node) {
              return node.getClassName() === 'Group'
            })[1];

            console.log(crossImageGroup);

            crossImageGroup.attrs.x = 100;

          });

          this.layer.add(transformer);
          this.layer.draw();
          return
        }



        this.setState({
          groups: this.state.groups.filter(groupItem => groupItem._id !== item._id)
        });

        this.stage.find('Transformer').destroy();
        item.remove();
        this.layer.draw()
      }));

      this.drawingGroup.add(this.rect);
      this.layer.add(this.group);
      this.group.draw();
    });

    // рисуем рект, при этом отменяем всплытие события для того, чтобы при днд не рисовать еще один рект
    this.stage.on('mousemove', (e) => {
      e.cancelBubble = true;

      if (!this.imageToDetect) {
        return
      }

      const { attrs: imageToDetectAttrs } = this.imageToDetect;

      let posNow = { x: e.evt.layerX, y: e.evt.layerY };
      let posStart = { x: this.state.startDrawingPositionX, y: this.state.startDrawingPositionY };

      const imageToDetectX1 = imageToDetectAttrs.x;
      const imageToDetectX2 = imageToDetectAttrs.x + imageToDetectAttrs.width;
      const imageToDetectY1 = imageToDetectAttrs.y;
      const imageToDetectY2 = imageToDetectAttrs.y + imageToDetectAttrs.height;

      // даем возможность рисовать только в рамках изображения
      if (posNow.x < imageToDetectX1) {
        posNow.x = imageToDetectX1;
      }

      if (posNow.x > imageToDetectX2) {
        posNow.x = imageToDetectX2;
      }

      if (posNow.y < imageToDetectY1) {
        posNow.y = imageToDetectY1;
      }

      if (posNow.y > imageToDetectY2) {
        posNow.y = imageToDetectY2
      }

      if (!this.state.isDrawing) {
        return
      }

      updateDrag(
          posNow,
          posStart,
          this.drawingGroup,
          this.rect,
          this.layer
      );
    });

    // проверяем условия ректа и добавляем иконку удаления
    this.stage.on('mouseup', (e) => {

      const { isDrawing } = this.state;

      if (!isDrawing) {
        return
      }

      const { attrs } = this.rect;

      if (Math.abs(attrs.height) < 20 || Math.abs(attrs.width) < 20 ) {
        this.setState({
          groups: this.state.groups.filter(groupItem => groupItem._id !== this.group._id)
        });

        this.group.remove();
        this.layer.draw()
      }

      const crossImageObj = new Image();

      crossImageObj.onload = () => {

        const imageSize = 15;
        const imagePositionFromAngle = 10;

        this.crossImage = new Konva.Image({
          x: this.drawingGroup.attrs.x + this.rect.attrs.width - imageSize * 2,
          y: this.drawingGroup.attrs.y + imagePositionFromAngle,
          image: crossImageObj,
          width: imageSize,
          position: 'absolute',
          height: imageSize,
        });

        //imageToDetect.rotate(90)
        // todo add cross for delete
        // add the shape to the layer
        this.group.add(new Konva.Group({
          x: this.drawingGroup.attrs.x + this.rect.attrs.width - imageSize * 2,
          y: this.drawingGroup.attrs.y + imagePositionFromAngle,
          draggable: false,
        }).add(this.crossImage));
        // add the layer to the stage
        this.layer.draw();
      };

      crossImageObj.src = multiply;

      this.setState({
        isDrawing: false,
        startDrawingPositionX: null,
        startDrawingPositionY: null,
      })
    });

    this.stage.add(this.layer);
  }

  handleGetData = () => {
    const { ratio, shiftX, shiftY } = this.state;
    let groupsCoordinates = [];

    class CoordsWithResizeToOriginalImage {
      constructor(x, y, width, height) {
        this.x = x;
        this.x1 = x + width;
        this.y = y;
        this.y1 = y + height;
        this.width = width;
        this.height = height;
      }
    }

    this.state.groups.forEach(group => {
      const { x, y, width, height } = group.getClientRect();

      groupsCoordinates.push( new CoordsWithResizeToOriginalImage(
          Math.round((x - shiftX) / ratio),
          Math.round((y - shiftY) / ratio),
          Math.round(width / ratio),
          Math.round(height / ratio)
      ))
    });

    const filteredGroupsCoordinates = groupsCoordinates.filter(item => {
      return item;
    });

    console.log(JSON.stringify(filteredGroupsCoordinates));
    this.setState({
      cords: filteredGroupsCoordinates
    });

    this.layer.clear();
  };

  calculateAspectRatioFit = (srcWidth, srcHeight, maxWidth, maxHeight) => {
    this.setState({
      ratio: Math.min(maxWidth / srcWidth, maxHeight / srcHeight)
    });
    const { ratio } = this.state;

    return {
      width: srcWidth * ratio,
      height: srcHeight * ratio,
    };
  };

  calculateScale = (imgWidth, imgHeight) => {
    const { canvasWidth, canvasHeight } = this.state;

    this.setState({
      scale: Math.min(canvasWidth / imgWidth, canvasHeight / imgHeight)
    })
  };

  render() {

    const { cords } = this.state;

    return (
        [
            <div key='1' id='container' style={ { border: '5px solid black', width: '700px', height: '450px', margin: '25px 0' } } />,
            <button onClick={ this.handleGetData } key='2'>get rects</button>,
            <div key='3' className='container' style={ { position: 'relative' } }>
              <img src={ image } alt=""/>
              { cords.map((item, index) => (
                  <div
                      key={ index }
                      style={
                        { height: item.height,
                          width: item.width,
                          top: item.y,
                          left: item.x,
                          position: 'absolute',
                          background: 'rgba(0, 255, 2, 0.7)'
                        } }
                  >
                  </div>
              )) }
            </div>
        ]
    );
  }
}

export default App;
