import React, { Component } from 'react';
import Konva from 'konva';
import './App.css';

const TOP_LEFT = 'TOP_LEFT';
const TOP_RIGHT = 'TOP_RIGHT';
const BOTTOM_LEFT = 'BOTTOM_LEFT';
const BOTTOM_RIGHT = 'BOTTOM_RIGHT';

const image = 'https://pp.userapi.com/c543106/v543106905/4a3c5/AGfDzFGLFxc.jpg';

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
  return ({x1: r1x, y1: r1y, x2: r2x, y2: r2y});
};

const updateDrag = (posNow, posStart, group, rect, layer) => {
  const posRect = reverse(posStart, posNow);
  group.x(posRect.x1);
  group.y(posRect.y1);
  rect.width(posRect.x2 - posRect.x1);
  rect.height(posRect.y2 - posRect.y1);
  rect.visible(true);
  layer.draw();
};

const getCenteredCoords = (axisRectCoordinate, rectMetrics, sizeOfContent) => {
  return axisRectCoordinate + (rectMetrics - sizeOfContent) / 2;
};

const updateCrossImageCords = (crossImage) => {
  const rect = crossImage.parent.getChildren(node => node.getClassName() === 'Rect')[0];
  const { x, y, width, height} = rect.attrs;

  crossImage.x(getCenteredCoords(
      x,
      width,
      crossImage.width()
  ));

  crossImage.y(getCenteredCoords(
      y,
      height,
      crossImage.height()
  ));
};

const updateAnchorsCoords = (group) => {
  const rect = group.find(node => node.getClassName() === 'Rect')[0];
  const topLeft = group.find(`.${TOP_LEFT}`)[0];
  const topRight = group.find(`.${TOP_RIGHT}`)[0];
  const bottomLeft = group.find(`.${BOTTOM_LEFT}`)[0];
  const bottomRight = group.find(`.${BOTTOM_RIGHT}`)[0];

  topLeft.x(rect.x());
  topLeft.y(rect.y());

  topRight.x(rect.x() + rect.width());
  topRight.y(rect.y());

  bottomLeft.x(rect.x());
  bottomLeft.y(rect.y() + rect.height());

  bottomRight.x(rect.x() + rect.width());
  bottomRight.y(rect.height() + rect.y())
};

const addAnchor = ({x, y, name, imageToDetect }) => {
  const minimalSizeOfRect = 30;

  const imageX1 = imageToDetect.x();
  const imageX2 = imageToDetect.x() + imageToDetect.width();
  const imageY1 = imageToDetect.y();
  const imageY2 = imageToDetect.y() + imageToDetect.height();

  const getOptimalSizeOfRect = (size) => size > minimalSizeOfRect ? size : minimalSizeOfRect;

  const anchor = new Konva.Circle({
    x: x,
    y: y,
    strokeWidth: 0.5,
    stroke: '#000',
    fill: '#fff',
    radius: 4,
    name: name,
    draggable: true,
    cursor: 'pointer'
  });

  anchor.on('dragmove', (e) => {
    const x = e.target.x();
    const y = e.target.y();

    const crossImage = e.target.parent.getChildren(node => node.getClassName() === 'Image')[0];
    const rect = e.target.parent.getChildren(node => node.getClassName() === 'Rect')[0];
    const topLeftAnchor = e.target.parent.find(`.${TOP_LEFT}`)[0];
    const bottomLeftAnchor = e.target.parent.find(`.${BOTTOM_LEFT}`)[0];
    const topRightAnchor = e.target.parent.find(`.${TOP_RIGHT}`)[0];
    const activeAnchorName = e.target.name();

    // ресайз по оси Х
    switch (activeAnchorName) {
      case (TOP_LEFT):
      case (BOTTOM_LEFT): {

        if (x <= imageX1) {
          const coordsDiffX = topRightAnchor.x() - imageX1;
          const newWidth = getOptimalSizeOfRect(coordsDiffX);
          rect.width(newWidth);
          rect.x(imageX1);
          return;
        }

        const coordsDiffX = topRightAnchor.x() - x;
        const newWidth = getOptimalSizeOfRect(coordsDiffX);
        rect.width(newWidth);
        rect.x(topRightAnchor.x() - newWidth);
        break;
      }

      case (TOP_RIGHT):
      case (BOTTOM_RIGHT): {

        if (x >= imageX2) {
          const coordsDiffX = imageX2 - topLeftAnchor.x();
          const newWidth = getOptimalSizeOfRect(coordsDiffX);
          rect.width(newWidth);
          return;
        }

        const coordsDiffX = x - topLeftAnchor.x();
        const newWidth = getOptimalSizeOfRect(coordsDiffX);
        rect.width(newWidth);

        break;
      }
      default: {
        return null;
      }
    }

    // Ресайз по оси Y
    switch (activeAnchorName) {
      case (BOTTOM_LEFT):
      case (BOTTOM_RIGHT): {

        if (y >= imageY2) {
          const coordsDiffY = imageY2 - topLeftAnchor.y();
          const newHeight = getOptimalSizeOfRect(coordsDiffY);
          rect.height(newHeight);
          return;
        }

        const coordsDiffY = y - topLeftAnchor.y();
        const newHeight = getOptimalSizeOfRect(coordsDiffY);
        rect.height(newHeight);
        break;
      }
      case (TOP_LEFT):
      case (TOP_RIGHT): {

        if (y <= imageY1) {
          const coordsDiffY = bottomLeftAnchor.y() + imageY1;
          const newHeight = getOptimalSizeOfRect(coordsDiffY);
          rect.y(imageY1);
          rect.height(newHeight);
          return;
        }

        const coordsDiffY = bottomLeftAnchor.y() - y;
        const newHeight = getOptimalSizeOfRect(coordsDiffY);
        rect.height(newHeight);
        rect.y(bottomLeftAnchor.y() - newHeight);
        break;
      }
      default: {
        return null;
      }
    }

    updateCrossImageCords(crossImage);
  });

  return anchor;
};

class App extends Component {
  state = {
    canvasHeight: 540,
    canvasWidth: 1000,
    isDrawing: false,
    startDrawingPositionX: null,
    startDrawingPositionY: null,
    groups: [],
    ratio: null,
    scale: null,
    naturalScale: null,
    cords: [{width: 0, height: 0, x: 0, y: 0}]
  };

  startDrawing = () => {
    this.setState({
      isDrawing: true
    })
  };

  stopDrawing = () => {
    this.setState({
      isDrawing: false
    })
  };

  stage;
  layer;
  rect;
  group;
  imageToDetect;
  crossImage;

  componentDidMount() {
    const { canvasHeight, canvasWidth } = this.state;

    // создаем Stage - канвас, для рисования
    this.stage = new Konva.Stage({
      container: 'container',
      width: canvasWidth,
      height: canvasHeight
    });

    this.layer = new Konva.Layer();

    // доавбляем изображение для модерации
    const imageObj = new Image();
    imageObj.onload = (e) => {

      const imageNaturalHeight = e.target.naturalHeight;
      const imageNaturalWidth = e.target.naturalWidth;

      // расчитываем необходимый ресайз изображения под канвас
      const imageSize = this.calculateAspectRatioFit(
          imageNaturalWidth,
          imageNaturalHeight,
          canvasWidth,
          canvasHeight
      );

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
        height: imageSize.height
      });

      // обновляем леер
      this.layer.add(this.imageToDetect);
      this.layer.draw();
    };
    imageObj.src = image;

    this.stage.on('mousedown', (e) => {

      // присваиваем группу для редактирования размеров
      this.group = e.target.parent;

      const targetClassName = e.target.getClassName();

      if (targetClassName === 'Circle' || targetClassName === 'Rect') {
        return;
      }

      if (e.target.hasName('CROSS_IMAGE')) {
        return;
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

      this.startDrawing();

      this.setState({
        startDrawingPositionX: e.evt.layerX,
        startDrawingPositionY: e.evt.layerY
      });

      // создаем группу, в которой хранится рект и иконка удаления
      this.group = new Konva.Group({
        name: 'group'
      });

      this.group.on('dragmove', (e) => {
        const rect = e.target;

        const crossImage = rect.parent.getChildren(function(node) {
          return node.getClassName() === 'Image';
        })[0];

        const rectWidth = rect.attrs.width ;
        const rectHeight = rect.attrs.height;

        const groupPositionX = rect.attrs.x;
        const groupPositionY = rect.attrs.y;

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
          rect.x(imageToDetectX2 - rectWidth);
        }

        // запрет выхода за левый край по Х
        if (groupPositionX <= imageToDetectX1) {
          rect.x(imageToDetectX1);
        }

        // запрет выхода наверх по Y
        if (groupPositionY <= imageToDetectY1) {
          rect.y(imageToDetectY1);
        }

        // запрет выходна вниз по Y
        if ( sumY >= imageToDetectY2 ) {
          rect.y(imageToDetectY2 - rectHeight);
        }

        // обновление иконки закрытия и якорей
        updateCrossImageCords(crossImage);
        updateAnchorsCoords(this.group)
      });

      this.rect = new Konva.Rect({
        x: e.evt.layerX,
        y: e.evt.layerY,
        width: 0,
        height: 0,
        fill: 'rgba(255, 255, 255, 0.7)',
        stroke: 'black',
        overflow: 'hidden',
        cursor: 'pointer',
        strokeWidth: 1,
        name: 'rect',
        draggable: true
      });

      this.layer.draw();

      this.setState({
        groups: [...this.state.groups, this.group]
      });

      // добавляем событие удаления только по клику на иконку крестика
      this.state.groups.forEach(item => item.on('click', (e) => {

        // Удаление по клику
        if (e.target.attrs.image) {
          this.setState({
            groups: this.state.groups.filter(groupItem => groupItem._id !== item._id)
          });

          item.remove();
          this.layer.draw();
          return
        }

        this.layer.draw()
      }));

      this.group.add(this.rect);
      this.layer.add(this.group);
      this.group.draw();
    });

    // рисуем рект, при этом отменяем всплытие события для того, чтобы при днд не рисовать еще один рект
    this.stage.on('mousemove', (e) => {
      if (!this.state.isDrawing) {
        return;
      }

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
        const rectX2 = this.rect.x() + this.rect.width();
        this.rect.x(imageToDetectX1);
        this.rect.width(rectX2 - imageToDetectX1);
        this.layer.draw();
        this.addControls();
        this.stopDrawing();
        return;
      }

      if (posNow.x > imageToDetectX2) {
        posNow.x = imageToDetectX2;
        const newWidth = imageToDetectX2 - this.rect.x();
        this.rect.width(newWidth);
        this.layer.draw();
        this.addControls();
        this.stopDrawing();
        return;
      }

      if (posNow.y <= imageToDetectY1) {
        posNow.y = imageToDetectY1;
        const newHeight = imageToDetectY1 + ( this.rect.y() + this.rect.height());
        this.rect.y(imageToDetectY1);
        this.rect.height(newHeight);
        this.layer.draw();
        this.addControls();
        this.stopDrawing();

        return;
      }

      if (imageToDetectY2 - posNow.y <= 5) {
        console.log("AHTUNG");
        posNow.y = imageToDetectY2;
        this.rect.height(imageToDetectY2 - this.rect.y());
        this.layer.draw();
        this.addControls();
        this.stopDrawing();
        return;
      }

      updateDrag(
          posNow,
          posStart,
          this.rect,
          this.rect,
          this.layer
      );
    });

    this.stage.on('mouseup', () => {
      const { isDrawing } = this.state;

      if (!isDrawing) {
        return;
      }

      this.drawRect()
    });

    this.stage.add(this.layer);
  }

  addControls = () => {
    const crossImageObj = new Image();

    crossImageObj.onload = () => {
      const imageSize = 15;

      this.crossImage = new Konva.Image({
        x: getCenteredCoords(this.rect.attrs.x, this.rect.attrs.width, imageSize),
        y: getCenteredCoords(this.rect.attrs.y, this.rect.attrs.height, imageSize),
        image: crossImageObj,
        width: imageSize,
        height: imageSize,
        keepRatio: true,
        name: 'CROSS_IMAGE'
      });

      this.group.add(addAnchor({
        x: this.rect.x(),
        y: this.rect.y(),
        name: TOP_LEFT,
        imageToDetect: this.imageToDetect,
      }));

      this.group.add(addAnchor({
        x: this.rect.x() + this.rect.width(),
        y: this.rect.y(),
        name: TOP_RIGHT,
        imageToDetect: this.imageToDetect,
      }));

      this.group.add(addAnchor({
        x: this.rect.x(),
        y: this.rect.y() + this.rect.height(),
        name: BOTTOM_LEFT,
        imageToDetect: this.imageToDetect,
      }));

      this.group.add(addAnchor({
        x: this.rect.x() + this.rect.width(),
        y: this.rect.y() + this.rect.height(),
        name: BOTTOM_RIGHT,
        imageToDetect: this.imageToDetect,
      }));

      this.group.add(this.crossImage);
      this.layer.draw();
    };

    crossImageObj.src = 'https://image.flaticon.com/icons/svg/463/463065.svg';
  };

  drawRect = () => {
    const { isDrawing } = this.state;

    if (!isDrawing) {
      return;
    }

    if (this.rect.height() === 0 && this.rect.width() === 0) {
      this.group.remove();
      this.layer.draw();
      return;
    }

    if (this.rect.height() < 20) {
      this.rect.height(30);
    }

    if (this.rect.width() < 20) {
      this.rect.width(30);
    }

    this.addControls();
    this.stopDrawing();
  };

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
      const anchorSize = 5;
      const borderSize = 1;

      groupsCoordinates.push( new CoordsWithResizeToOriginalImage(
          Math.round((x - borderSize + anchorSize - shiftX) / ratio),
          Math.round((y - borderSize + anchorSize - shiftY) / ratio),
          Math.round(width - 10 / ratio),
          Math.round(height - 10 / ratio)
      ))
    });

    const filteredGroupsCoordinates = groupsCoordinates.filter(item => {
      return item;
    });

    console.log(JSON.stringify(filteredGroupsCoordinates));
    this.setState({
      cords: filteredGroupsCoordinates
    })
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
            <div key='1' id='container' style={ { border: '5px solid black', width: '1000px', height: '540px', margin: '25px 0' } } />,
            <button onClick={ this.handleGetData } key='2'>get rects</button>,
            <div key='3' className='container' style={ { position: 'relative' } }>
              <img src={ image } alt=""/>
              { cords.map((item, index) => (
                  <div key={ index } style={ { height: item.height, width: item.width, top: item.y, left: item.x, position: 'absolute', background: 'rgba(0, 255, 2, 0.7)' } }>

                  </div>
              )) }

            </div>
        ]
    );
  }
}

export default App;
