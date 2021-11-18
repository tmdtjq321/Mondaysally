# Mondaysally

## 💭Idea
먼데이샐리는 사내 복지 문화 관리 서비스 App

## ✨Slogan
"출근이 즐거워 :)"

## 🎯Target
젊은 층(20대 중후반 - 30대 초반)이 많은 스타트업 / 중소기업

## 🌟System
* 기업/직원등록 
* 출/퇴근
* 기프트 히스토리
* 기프트 샵
* 트윙클
* 마이페이지

### REST API
REST API의 기본 구성 원리를 준수하여 라우팅을 진행했습니다.

### Process
- 도메인 폴더 구조
> Route - Controller - Provider/Service - DAO

- Route: Request에서 보낸 라우팅 처리
- Controller: Request를 처리하고 Response 반환. (Provider/Service에 넘겨주고 다시 받아온 결과값을 형식화), 형식적 Validation
- Provider: 비즈니스 로직 처리, 의미적 Validation과 조회 기능 로직 처리
- Service: 비즈니스 로직 처리, 의미적 Validation 생성/수정/삭제 기능 로직 처리
- DAO: Data Access Object의 줄임말. Query가 작성되어 있는 부분 

> `Request` -> Route -> Controller -> Service/Provider -> DAO -> DB -> DAO -> Service/Provider -> Controller -> Route -> `Response`

## ✨Structure
앞에 (*)이 붙어있는 파일(or 폴더)은 추가적인 과정 이후에 생성된다.
```
├── config                              # 설정 파일
│   ├── baseResponseStatus.js           # Response 시의 Status들을 모아 놓은 곳. 
│   ├── database.js                     # 데이터베이스 관련 설정
│   ├── express.js                      # express Framework 설정 파일
│   ├── jwtMiddleware.js                # jwt 관련 미들웨어 파일
│   ├── secret.js                       # 서버 key 값들 
│   ├── FCM.js                          # FCM 메시지 전송 모듈
│   ├── FIREBASE_CREDENTIAL.json        # FCM 인증 키 
│   ├── redis.js                        # redis 접속 모듈
│   ├── winston.js                      # logger 라이브러리 설정
├── * log                               # 생성된 로그 폴더
├── * node_modules                    	# 외부 라이브러리 폴더 (package.json 의 dependencies)
├── src                     		        # 메인 로직
│   ├── app                             # 앱에 대한 코드 작성
│ 	│   ├── Clover                      # Clover 도메인 폴더
│ 	│   ├── Common                      # Common 도메인 폴더
│ 	│   ├── Gift                        # Gift 도메인 폴더
│ 	│   ├── Home                        # Home 도메인 폴더
│ 	│   ├── Twinkle                     # Twinkle 도메인 폴더
│ 	│   ├── User                        # User 도메인 폴더
│ 	│   ├── Work                        # Work 도메인 폴더
├── .gitignore                     		  # git 에 포함되지 않아야 하는 폴더, 파일들을 작성 해놓는 곳
├── index.js                            # 포트 설정 및 시작 파일    
├── crontab.sh                          # 스케줄러를 활용한 API 호출 기능 파일
├── * package-lock.json              	 
├── package.json                        # 프로그램 이름, 버전, 필요한 모듈 등 노드 프로그램의 정보를 기술
└── README.md
```

### Description
- `config`: 환경설정 및 `src`에서 필요한 기능을 모듈화시켜 저장한 영역입니다. express Framework 설정, DB 로그인 정보, FCM 인증 정보, winston 로깅, FCM 메시지 전송 기능, 응답메시지, redis 접속 기능 등으로 구성되어 있습니다. 

- `src`: 메인 로직으로 기능별로 구성되어 있습니다. 모든 도메인들은 Route - Controller - Provider/Service - DAO 구조로 구성되어 있습니다.
   * Clover: 앱 내에서 포인트로 사용되는 클로버 기능
   * Common: 현재 앱의 버전정보 조회 및 firebase 디바이스 토큰 저장
   * Gift: 기프트 관련 기능
   * Home: 홈 화면 조회
   * Twinkle: 트윙클 관련 기능
   * User: 유저 정보 관련 기능
   * Work: 출/퇴근 관련 기능

- `그 외`: crontab.sh 리눅스 스케줄러 크론탭을 사용한 자동퇴근 API 호출

# Framework and Modules
### [Node.js](https://nodejs.org/ko/)
-  `node index.js` 를 통해서 js 파일을 실행한다.
-  node는 js 파일을 실행할 때 `package.json` 이라는 파일을 통해서 어떤 환경으로 구동하는지, 어떤 라이브러리들을 썼는지(dependencies) 등의 기본적인 설정값 들을 참고했습니다.
- `npm install` npm(node package manager)을 통해 package.json에 있는 dependencies 등을 참고하여 node_modules 폴더를 생성하고 라이브러리 파일을 다운로드 했습니다. 이 라이브러리들은 사용하고 싶은 파일에서 require 하여 사용했습니다.

### [Express](https://expressjs.com/ko/)
config > express.js 에서 express 프레임워크를 기반으로 한 app 모듈을 export 하도록 하여 어느 폴더에서든 사용할 수 있도록 구성했습니다.
`index.js`에서 express에서 만든 app이 3000번 포트를 Listen 하도록 구성했습니다.

### [mysql2](https://www.npmjs.com/package/mysql2)
Database는 config > database.js에 mysql2 라이브러리를 사용해 구성했다. 자세한 설명과 추가적인 기능들은 mysql2 라이브러리의 공식 README를 참고했습니다.

### [winston](https://www.npmjs.com/package/winston)
Log는 winston, winston-daily-rotate-file 라이브러리를 사용해 구성했습니다.

### [PM2](https://pm2.keymetrics.io/)
무중단 서비스를 위해 PM2를 사용했습니다. ex) pm2 start index.js --watch --ignore-watch="config/* node_modules/*"

### [FCM](https://firebase.google.com/docs/cloud-messaging)
사용자에게 보낼 알람 기능을 위한 해당 API를 참고했습니다.

### [crontab](https://jdm.kr/blog/2)
스케줄러 기능을 위해 해당 블로그를 참조해 crontab을 사용했습니다.

### [redis](https://redis.io/)
캐시 서버로 사용하기 위해 redis를 사용할 예정입니다.

