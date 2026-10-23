/**
  © BlockyApps. You are permitted to use this content within your store. Redistribution or use in any other application is strictly prohibited. 
  Unauthorized copying, distribution, or reproduction in any form will result in legal action.
**/
if (!customElements.get('blocky-video')) {
  customElements.define('blocky-video',
    class BlockyVideo extends HTMLElement {
      constructor() {
        super()
        this.video = this.querySelector("video")
        this.isManual = this.classList.contains("blocky-video-manual")
        if (this.video) {
          this.prepareInlinePlayback()
          if (!this.isManual) {
            this.prepareAutoplay()
          }
          this.video.addEventListener('waiting', (e) => {
            if (e.target.currentTime > 0) this.showSpinner();
          });
          this.video.addEventListener('playing', this.hideSpinner.bind(this));
          this.video.addEventListener('canplaythrough', this.hideSpinner.bind(this));
          this.video.addEventListener('canplay', () => {
            this.hideSpinner();
            if (!this.isManual) this.tryAutoplay();
          });
          this.video.addEventListener('error', this.hideSpinner.bind(this));
        }
        if (this.isManual) {
          this.video.addEventListener("click", (e) => this.onClick())
          const button = this.querySelector(".blocky-video-play-button")
          if (button) button.addEventListener("click", (e) => this.onClick())
        } else {
          this.video.addEventListener("pause", (event) => {
            if (event.target.paused && !this.isManual && !document.hidden) this.tryAutoplay()
          })
        }

        this.waitForHeroThenObserve();
      }

      waitForHeroThenObserve() {
        const hero = document.querySelector('blocky-featured-product');
        const start = () => this.observeVisibility();

        if (!hero || document.documentElement.classList.contains('waymelo-hero-ready') || document.readyState === 'complete') {
          start();
          return;
        }

        window.addEventListener('waymelo:hero-ready', start, { once: true });
        setTimeout(start, 500);
      }

      observeVisibility() {
        if ("IntersectionObserver" in window) {
          this.observer = new IntersectionObserver(this.handleIntersection.bind(this), {
            root: null,
            rootMargin: '200px 0px',
            threshold: 0.05
          });
          this.observer.observe(this);
          return;
        }

        this.hydratePoster();
        if (!this.isManual) {
          if (this.hydrateSources()) this.video.load();
          this.tryAutoplay();
        }
      }

      hydratePoster() {
        const poster = this.video?.dataset.poster;
        if (!poster) return;
        this.video.poster = poster;
        delete this.video.dataset.poster;
      }

      hydrateSources() {
        let hydrated = false;
        for (const source of this.video.querySelectorAll('source[data-src]')) {
          if (!source.hasAttribute('src')) {
            source.setAttribute('src', source.getAttribute('data-src'));
            hydrated = true;
          }
          source.removeAttribute('data-src');
        }
        return hydrated;
      }

      handleIntersection(entries) {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.hydratePoster();
            if (!this.isManual) {
              if (this.hydrateSources()) this.video.load();
              this.tryAutoplay();
            }
          } else {
            if (!this.isManual && this.video && !this.video.paused) {
              this.video.pause();
            }
          }
        });
      }

      onClick() {
        const button = this.querySelector(".blocky-video-play-button")
        if (this.video.paused == true) {
          this.showSpinner()
          this.hydratePoster()
          if (this.hydrateSources()) this.video.load()
          const playPromise = this.video.play()      
          playPromise.then(() => {
            this.hideSpinner()
          }).catch((error) => {
            this.hideSpinner()
          });
          this.video.classList.add("blocky-video-playing")
          if (button) button.classList.add("blocky-hidden")
        } else {
          this.video.pause()
          this.video.classList.remove("blocky-video-playing")
          if (button) button.classList.remove("blocky-hidden")
        }
      }

      prepareAutoplay() {
        if (!this.video) return;
        this.video.muted = true;
        this.video.defaultMuted = true;
        this.video.autoplay = true;
        this.video.loop = true;
        this.video.setAttribute('muted', '');
        this.video.setAttribute('autoplay', '');
        this.video.setAttribute('loop', '');
        this.prepareInlinePlayback();
      }

      prepareInlinePlayback() {
        if (!this.video) return;
        this.video.playsInline = true;
        this.video.disablePictureInPicture = true;
        this.video.controls = false;
        this.video.setAttribute('playsinline', '');
        this.video.setAttribute('webkit-playsinline', '');
        this.video.setAttribute('disablepictureinpicture', '');
        this.video.setAttribute('controlslist', 'nofullscreen nodownload noremoteplayback');
      }

      tryAutoplay() {
        if (!this.video || this.isManual || document.hidden) return;
        this.prepareAutoplay();
        const playPromise = this.video.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(() => {
            const retry = () => {
              if (this.video && !this.isManual && this.video.paused) {
                this.video.play().catch(() => {});
              }
              window.removeEventListener('scroll', retry, { passive: true });
              window.removeEventListener('touchstart', retry, { passive: true });
              window.removeEventListener('click', retry);
            };
            window.addEventListener('scroll', retry, { passive: true, once: true });
            window.addEventListener('touchstart', retry, { passive: true, once: true });
            window.addEventListener('click', retry, { once: true });
          });
        }
      }

      disconnectedCallback() {
        if (this.observer) this.observer.disconnect();
      }

      showSpinner() {
        if (this.video) this.video.classList.add('loading');
      }

      hideSpinner() {
        if (this.video) this.video.classList.remove('loading');
      }
    }
  )
}
