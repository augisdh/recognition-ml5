import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  OnDestroy
} from "@angular/core";
import * as ml5 from "ml5";
import { timer, Subscription } from "rxjs";

@Component({
  selector: "app-video",
  templateUrl: "./video.component.html",
  styleUrls: ["./video.component.css"]
})
export class VideoComponent implements OnInit, OnDestroy {
  @ViewChild("videoPlayer") videoPlayer: ElementRef;
  @ViewChild("countTime") countTime: ElementRef;

  screenWidth: any;
  screenWidthHeightRatio = 1.2; //0.5625
  videoPlaying = false;
  tryToUnlock = false;
  modelLoaded = false;
  subscription = new Subscription();

  mobilenet: any;
  classifier: any;

  constructor() {}

  ngOnInit(): void {
    this.getInnerWidth();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  loadModel() {
    this.mobilenet = ml5.featureExtractor("MobileNet", () => this.modelReady());
    this.classifier = this.mobilenet.classification(
      this.videoPlayer.nativeElement,
      () => this.videoReady()
    );
  }

  modelReady() {
    this.modelLoaded = true;
    console.log("Model ready!");
  }

  videoReady() {
    console.log("Video is ready!");
  }

  imageAdded() {
    console.log("Image was added!");
  }

  recordSnapshots(validImage: boolean) {
    const numberOfSnaps = 100;

    if (validImage) {
      for (let i = 0; i < numberOfSnaps; i++) {
        setTimeout(
          () =>
            this.classifier.addImage("verfied user!", () => this.imageAdded()),
          10 * i
        );
      }
    } else {
      for (let i = 0; i < numberOfSnaps; i++) {
        setTimeout(
          () =>
            this.classifier.addImage("invalid user!", () => this.imageAdded()),
          10 * i
        );
      }
    }
  }

  trainModel() {
    this.classifier.train(this.whileTraining);
  }

  whileTraining(loss) {
    if (loss === null) {
      console.log("Training completed");
    } else {
      console.log(loss);
    }
  }

  verfieUser() {
    let time = null;

    this.subscription = timer(250, 250).subscribe(val => {
      time = val;

      if (time >= 20) {
        time = null;
        this.subscription.unsubscribe();
      }

      if (time && time <= 20) {
        this.classifier.classify(this.getResults);
      }
      this.updateShowField(time);
    });
  }

  getResults(error, result) {
    if (error) {
      console.error(error);
    } else {
      console.log(result);
      console.log(
        `Label: ${result[0].label} | Confidence: ${result[0].confidence}`
      );
    }
  }

  updateShowField(count) {
    this.countTime.nativeElement.innerText = count;
  }

  getInnerWidth() {
    this.screenWidth = window.innerWidth / 2;
  }

  getWebCamAccess() {
    this.videoPlaying = true;
    this.tryToUnlock = true;

    try {
      navigator.getUserMedia(
        {
          audio: false,
          video: {
            width: this.screenWidth,
            height: this.screenWidth * this.screenWidthHeightRatio
          }
        },
        stream => {
          this.videoPlayer.nativeElement.srcObject = stream;

          this.videoPlayer.nativeElement.onloadedmetadata = () => {
            this.videoPlayer.nativeElement.play();
          };
        },
        err => {
          this.videoPlaying = false;
          this.tryToUnlock = false;
          console.error(err);
        }
      );
    } catch (error) {
      this.videoPlaying = false;
      this.tryToUnlock = false;
      console.error(error);
    }
  }
}
