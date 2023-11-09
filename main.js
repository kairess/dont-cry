import { poseNet } from "ml5";
import p5 from "p5";
import { Bodies, Engine, Runner, World } from "matter-js";
import "./style.css"

const engine = Engine.create();
const world = engine.world;
Runner.run(engine);

let poses = [];
let drops = [];
const app = document.getElementById('app');

const drawSkeleton = (sketch) => {
  for (let i = 0; i < poses.length; i++) {
    // Keypoints
    for (let j = 0; j < poses[i].pose.keypoints.length; j++) {
      let keypoint = poses[i].pose.keypoints[j];

      if (keypoint.score > 0.5) {
        sketch.fill(255, 255, 0);
        sketch.ellipse(keypoint.position.x, keypoint.position.y, 10, 10);
      }
    }

    // Skeleton
    let skeleton = poses[i].skeleton;
    for (let j = 0; j < skeleton.length; j++) {
      let partA = skeleton[j][0];
      let partB = skeleton[j][1];

      sketch.stroke(255, 255, 0);
      sketch.line(partA.position.x, partA.position.y, partB.position.x, partB.position.y);
    }
  }
};

const drawDrops = (sketch) => {
  for (let i = 0; i < poses.length; i++) {
    let leftEye = poses[i].pose.leftEye;
    let rightEye = poses[i].pose.rightEye;
    let leftWrist = poses[i].pose.leftWrist;
    let rightWrist = poses[i].pose.rightWrist;

    if (sketch.frameCount % 15 == 0) {
      let distLeftEyeLeftWrist = sketch.dist(leftEye.x, leftEye.y, leftWrist.x, leftWrist.y);
      let distLeftEyeRightWrist = sketch.dist(leftEye.x, leftEye.y, rightWrist.x, rightWrist.y);

      let distRightEyeRightWrist = sketch.dist(rightEye.x, rightEye.y, rightWrist.x, rightWrist.y);
      let distRightEyeLeftWrist = sketch.dist(rightEye.x, rightEye.y, leftWrist.x, leftWrist.y);

      if (leftEye.confidence > 0.9 && distLeftEyeLeftWrist > 150 && distLeftEyeRightWrist > 150)
        drops.push(new Drop(leftEye.x, leftEye.y, 5, sketch))

      if (rightEye.confidence > 0.9 && distRightEyeRightWrist > 150 && distRightEyeLeftWrist > 150)
        drops.push(new Drop(rightEye.x, rightEye.y, 5, sketch))
    }
  }
};

class Drop {
  constructor(x, y, d, sketch) {
    this.d = d;
    this.sketch = sketch;

    this.body = Bodies.circle(x, y, d, {
      restitution: 0.2,
    });

    World.add(world, this.body);
  }

  show() {
    this.sketch.fill(29, 168, 242, 150);
    this.sketch.stroke(29, 168, 242, 150);
    this.sketch.ellipse(this.body.position.x, this.body.position.y + this.d * 3, this.d * 2, this.d * 2);

    this.sketch.noStroke();
    this.sketch.triangle(
      this.body.position.x - this.d * this.sketch.sqrt(3) / 2, this.body.position.y + this.d * 2,
      this.body.position.x + this.d * this.sketch.sqrt(3) / 2, this.body.position.y + this.d * 2,
      this.body.position.x, this.body.position.y - this.d * 2
    );

    // this.sketch.fill(29, 168, 242);
    // this.sketch.noStroke();
    // this.sketch.circle(this.body.position.x, this.body.position.y, this.d * 2);
  }
};

new p5((sketch) => {
  let video;

  sketch.setup = () => {
    sketch.createCanvas(640, 480);
    video = sketch.createCapture(sketch.VIDEO);
    video.hide();

    const net = poseNet(video, {
      detectionType: 'single',
    });

    net.on('pose', (results) => {
      poses = results;
    });
  };

  sketch.draw = () => {
    sketch.image(video, 0, 0, 640, 480);
    // drawSkeleton(sketch);
    drawDrops(sketch);

    for (var i = 0; i < drops.length; i++) {
      drops[i].show();
    }
  };
}, app);
