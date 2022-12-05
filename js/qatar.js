/** Obtiene todos los hermanos de un elemento del DOM */
const getSiblings = (element, selector = null) =>{
  let siblings = []

  if(!element.parentNode) { return siblings }

  const allChilds = element.parentNode.children
  Array.from(allChilds, child => {
    if(child != element && !child.matches(selector)) { siblings.push(child) }
  })

  return siblings
}

/** Obtiene todos los hermanos anteriores de un elemento del DOM */
function getPreviousSiblings(elem) {
  var sibs = [];
  while (elem = elem.previousSibling) {
      if (elem.nodeType === 3) continue; // text node
      sibs.push(elem);
  }
  return sibs;
}

/** Oculta una vista para mostrar otra */
const changePage = (from, to, activeClass, callback = () => {}) => {
  from.style.opacity = '0'
  setTimeout(() => {
    from.style.display = 'none'
    to.style.display = 'block'
    setTimeout(() => {
      to.style.opacity = '1'
      to.classList.add(activeClass)
      from.classList.remove(activeClass)
      callback()
    }, 250)
  }, 250)
}

/** Posiciona el indicador del menu activo */
const setMenuIndicator = () => {
  const nodeList = Array.prototype.slice.call(document.querySelectorAll('.q-page'))
  const active = document.querySelector('.q-page--active')
  const index = nodeList.indexOf(active)

  if(window.innerWidth > 1230) {
    const indicator = document.querySelector('.q-menu-indicator')
    indicator.style.top = `${62 * (index - 1)}px`
  }
  else {
    const indicator = document.querySelector('.q-menu-mob__indicator')
    const data = active.getAttribute('id').split('q-')[1]
    const buttonActive = document.querySelector(`.q-menu-mob__item[data-page="${data}"]`)
    const rects = buttonActive.getBoundingClientRect()
    indicator.style.left = `${rects.left - (window.innerWidth < 530 ? 10 : 15)}px`
  }
}

setMenuIndicator();

const menuButtons = document.querySelectorAll('.q-menu-item')
const menuMobButtons = document.querySelectorAll('.q-menu-mob__item')
const btns = [...menuButtons, ...menuMobButtons]
btns.forEach(btn => {
  btn.addEventListener('click', e => {
    const t = e.target
    const current = document.querySelector('.q-page--active')
    const page = document.querySelector(`#q-${t.getAttribute('data-page')}`)
    const siblings = getSiblings(page)
    
    changePage(current, page, 'q-page--active', () => {
      siblings.forEach(sib => {
        sib.classList.remove('q-page--active')
        sib.removeAttribute('style')
      })
      setMenuIndicator()
      startCalendar()
    })
  })
})

/** Se muestra la pantalla de trivias desde el acceso rápido */
const quizButton = document.querySelector('.q-quiz__start')
quizButton.addEventListener('click', () => {
  const quizMenuButton = document.querySelector('.q-menu-item[data-page="quiz"]')
  const event = new Event('click')
  quizMenuButton.dispatchEvent(event)
})

/** Quiz timer */
let interval = null
let timeout = null
const startTimer = () => {
  let timer = 30
  clearTimeout(timeout)
  clearInterval(interval)

  const fnInterval = () => {
    const tags = document.querySelectorAll('.q-timer__sec')
    const progressBar = document.querySelector('.q-timer__progress')

    progressBar.style.width = `calc(100% / 30 * ${timer})`
    tags.forEach(tag => {
      tag.innerHTML = timer
    })
    
    if(timer <= 0) {
      endTimer()
    }

    timer--
  }
  
  fnInterval()
  interval = setInterval(fnInterval, 1000)
}

const endTimer = () => {
  clearInterval(interval)
  interval = null
}

/** Cambia el contenido en la sección quiz */
const nextButtons = document.querySelectorAll('#q-quiz .q-quiz__next')
let questCounter = 0
let nextStep = ''

nextButtons.forEach(it => {
  it.addEventListener('click', e => {
    const t = e.target
    const fromPage = t.closest('.q-quiz__step')
    const step = fromPage.getAttribute('data-step')

    const getNextPage = () => {
      if(step == 'info') { nextStep = 'questions' }
      else if(step == 'questions' && questCounter < 5) { nextStep = 'questions' }
      else { nextStep = 'resume' }

      return document.querySelector(`#q-quiz .q-quiz__step[data-step="${nextStep}"]`)
    }

    const toPage = getNextPage()
    const callback = () => {
      let activeId = null
        
      if(step == 'info') {
        questCounter = 1
        activeId = document.querySelector(`#q-quiz .q-step[data-step="question-${questCounter}"]`)

        const stepInfo = document.querySelector(`#q-quiz .q-step[data-step="info"]`)
        stepInfo.classList.add('q-step--passed')
      }
      else if(step == 'questions' && questCounter > 0 && questCounter < 5) {
        questCounter++
        activeId = document.querySelector(`#q-quiz .q-step[data-step="question-${questCounter}"]`)
      }
      else if(step == 'questions' && questCounter == 5) {
        activeId = document.querySelector('#q-quiz .q-step[data-step="resume"]')
      }

      if(nextStep != 'resume') {
        startTimer()
        addQuizEvent()
        timeout = setTimeout(() => {
          endTimer()
          removeQuizEvent()
        }, 31 * 1000)
      }

      activeId.classList.add('q-step--active')
      const stepSibs = getSiblings(activeId)
      stepSibs.forEach(sib => sib.classList.remove('q-step--active'))
    }

    const answerMarker = (counter) => {
      const marker = document.querySelector(`#q-quiz .q-step[data-step="question-${counter}"]`)
      const randomAnswer = Math.random() < 0.5

      if(randomAnswer) { marker.classList.add('q-step--success') }
      else { marker.classList.add('q-step--failed') }
    }

    if(fromPage != toPage) {
      endTimer()
      changePage(fromPage, toPage, 'q-quiz__step--active', () => {
        callback()

        if(step == 'questions') {
          answerMarker(questCounter)
        }
      })
    } else {
      const fromQuestion = document.querySelector(`[data-question="${questCounter}"]`)
      const toQuestion = document.querySelector(`[data-question="${questCounter + 1}"]`)

      const defaultTimer = document.querySelectorAll('.q-timer__sec')
      defaultTimer.forEach(t => t.innerHTML = '30')

      const defaultProgress = document.querySelector('.q-timer__progress')
      defaultProgress.removeAttribute('style')

      if(questCounter == 4) {
        const nextButton = document.querySelector('.q-questions .q-quiz__next')
        nextButton.innerHTML = 'Finalizar'
      }
      
      endTimer()
      changePage(fromQuestion, toQuestion, 'q-question--active', () => {
        callback()

        if(step == 'questions') {
          answerMarker(questCounter - 1)
        }
      })
    }
    
  })
})

/** Choose quiz option */
const quizOptions = document.querySelectorAll('#q-quiz .q-question__option')
const addQuizEvent = () => {
  quizOptions.forEach(opt => {
    opt.addEventListener('click', e => {
      const t = e.target
      const sibs = getSiblings(t)
      t.classList.add('q-question__option--active')
      sibs.forEach(sib => sib.classList.remove('q-question__option--active'))
    })
  })
}

const removeQuizEvent = () => {
  quizOptions.forEach(opt => {
    opt.removeEventListener('click', null)
  })
}

/** Pollas */
const pollaNextButtons = document.querySelectorAll('#q-polla .q-polla__next')
let pollaStep = 'info'
pollaNextButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    let nextStep = ''
    if(pollaStep == 'info') { nextStep = 'round-1' }
    else if(pollaStep == 'round-1') { nextStep = 'round-2' }
    else { nextStep = 'resume' }

    const fromPage = document.querySelector(`.q-polla__step[data-step="${pollaStep}"]`)
    const toPage = document.querySelector(`.q-polla__step[data-step="${nextStep}"]`)

    changePage(fromPage, toPage, '.q-polla__step--active', () => {
      pollaStep = nextStep
      const currentStepper = document.querySelector(`#q-polla .q-step[data-step="${nextStep}"]`)
      currentStepper.classList.add('q-step--active')

      const otherStepper = getSiblings(currentStepper)
      otherStepper.forEach(stepper => stepper.classList.remove('q-step--active'))

      const prevStepper = getPreviousSiblings(currentStepper)
      prevStepper.forEach(stepper => stepper.classList.add('q-step--passed'))

      ballActions(toPage)
    })
  })
})

const groups = document.querySelectorAll('#q-polla .q-group__countries')
groups.forEach(group => {
  new Sortable(group, {
    animation: 150
  })
})

const roundSquare = (round = '') => {
  const square = document.querySelector('#q-polla .q-rounds__btn-square')

  let roundNumber = 0
  if(round == 'octavos') { roundNumber = 0 }
  else if(round == 'cuartos') { roundNumber = 1 }
  else if(round == 'semi') { roundNumber = 2 }
  else { roundNumber = 3 }

  square.style.top = `${60 * roundNumber}px`
}

const roundButtons = document.querySelectorAll('#q-polla .q-rounds__btn')
roundButtons.forEach(btn => {
  btn.addEventListener('click', e => {
    const t = e.target
    const round = t.getAttribute('data-round')

    const fromRound = document.querySelector(`#q-polla .q-rounds__matches--active`)
    const toRound = document.querySelector(`#q-polla .q-rounds__matches[data-round="${round}"]`)

    changePage(fromRound, toRound, 'q-rounds__matches--active', () => ballActions(toRound))

    t.classList.add('q-rounds__btn--active')
    const sibs = getSiblings(t)
    sibs.forEach(sib => sib.classList.remove('q-rounds__btn--active'))

    roundSquare(round)
  })
})

const ballActions = (page) => {
  const ballSquares = page.querySelectorAll('.q-match__score-square')
  ballSquares.forEach(sq => {
    sq.addEventListener('click', e => {
      const t = e.target
      const ball = t.querySelector('.icon-futbol')
      ball.style.opacity = '1'

      const sibs = getSiblings(t)
      sibs.forEach(sib => {
        if(sib.classList.contains('q-match__score-square')) {
          const ball = sib.querySelector('.icon-futbol')
          ball.style.opacity = '0'
        }
      })
    })
  })
}

// Fechas
const startCalendar = () => {
  const calendar = document.querySelector('.q-calendar')
  if(calendar != null) {
    const glide = new Glide('.q-calendar', {
      type: 'carousel',
      perView: 8,
      gap: 15,
      breakpoints: {
        770: { perView: 5 },
        530: { perView: 3 },
      }
    }).mount()
  
    glide.on(['swipe.end', 'run.after'], e => {
      console.log(glide.index)
    })
  }
}