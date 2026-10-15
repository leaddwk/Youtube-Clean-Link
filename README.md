# 유튜브 링크 정리

유튜브 공유 창의 주소 입력칸, 링크 미리보기, 복사·공유 주소를 정리하고, 받은 유튜브 링크도 서버에 요청하기 전에 추적 인자를 제거하는 Chrome Manifest V3 확장입니다. 시작 시간은 유지합니다.

## 1.1.0 변경 사항

- 받은 링크를 클릭하거나 주소창에 붙여 넣어 열 때 `si`, `feature`, `pp`, 표준 `utm_*` 등 등록된 추적 인자를 요청 전에 제거합니다. 시간(`t`, `start`, `end`)과 영상·재생목록 식별 값은 유지합니다.
- 메시지(Google Messages·SMS), Facebook, WhatsApp의 공유 주소도 정리합니다. 일반 링크뿐 아니라 클릭할 때 `window.open`으로 생성하는 주소와 브라우저 기본 공유 데이터도 처리합니다.
- 기존 설치는 같은 폴더를 새 파일로 교체하고 `chrome://extensions`에서 확장의 새로고침 버튼을 누른 뒤 유튜브 탭도 새로고침하세요. 새로 추가된 유튜브 사이트 권한을 승인해야 요청 전 제거가 적용됩니다.

## 설치

1. ZIP을 받았다면 먼저 압축을 풉니다.
2. 크롬 주소창에 `chrome://extensions`를 입력합니다.
3. 오른쪽 위 **개발자 모드**를 켭니다.
4. **압축해제된 확장 프로그램을 로드합니다**를 누릅니다.
5. `manifest.json` 파일이 들어 있는 `youtube-clean-link` 폴더를 선택합니다.
6. 이미 열려 있던 유튜브 탭을 새로고침합니다.

설치 안내: https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked

## 동작 예시

| 원본 | 표시·복사되는 주소 |
| --- | --- |
| `https://youtu.be/example1234?si=tracking` | `https://youtu.be/example1234` |
| `https://youtu.be/example1234?si=tracking&t=107` | `https://youtu.be/example1234?t=107` |
| `https://youtu.be/example1234?t=107&si=tracking` | `https://youtu.be/example1234?t=107` |
| `https://www.youtube.com/watch?v=example&si=tracking&t=107` | `https://www.youtube.com/watch?v=example&t=107` |

- 공유 창의 **시작 시간** 체크를 켜거나 끄면 새 주소에도 바로 적용됩니다.
- `youtu.be`, `/shorts/`, `/live/` 영상 링크의 쿼리는 시간 인자 `t`만 유지합니다. `#` 뒤의 앵커는 유지합니다.
- 일반 `watch` 주소의 `v`, `t`, 재생목록 `list`, `index` 등 기능에 필요한 값은 유지합니다. 추적용 `si`, `feature`, `pp`, `ab_channel`, `utm_*`, 광고 클릭 식별자 등을 제거합니다.
- 유튜브 내부 링크와 지원되는 소셜 공유 버튼에 들어 있는 유튜브 주소도 정리합니다. 소셜 서비스의 게시·전송 버튼은 사용자가 직접 누릅니다.
- 확장 버튼을 누르면 현재 유튜브 탭의 주소를 정리해서 복사할 수 있습니다. 다른 곳에서 받은 주소도 붙여 넣을 수 있습니다.

## 범위와 개인정보

- 자동 기능은 `youtube.com`, `youtu.be`, `youtube-nocookie.com`의 HTTP·HTTPS 페이지를 대상으로 합니다. 다른 사이트나 앱에서 받은 링크도 **이 확장이 설치된 Chrome에서 열면** 유튜브 요청 전에 정리합니다. 모바일 유튜브 앱이나 다른 브라우저는 적용 대상이 아닙니다.
- 받은 링크의 요청 전 정리는 `rules/incoming.json`에 등록된 25개 키를 대상으로 합니다. 이름이 정해지지 않은 임의의 `utm_*`는 공유 창·페이지 링크·팝업에서 정리하지만 요청 전 규칙에는 포함되지 않을 수 있습니다.
- 새로 열리는 주소는 요청 전에 정리되므로 주소창에도 정리된 주소가 표시됩니다. 이미 열려 있는 탭이나 페이지 내 `history.pushState`만으로 바뀐 주소에는 새 문서 요청이 없으므로 이 규칙이 실행되지 않습니다. 이런 주소는 팝업으로 정리해 복사할 수 있습니다.
- `activeTab`: 확장 버튼을 눌렀을 때 현재 탭 주소를 가져옵니다.
- `clipboardWrite`: 사용자가 팝업의 복사 버튼을 눌렀을 때 정리한 링크를 씁니다. 클립보드를 읽거나 감시하지 않습니다.
- `declarativeNetRequestWithHostAccess`와 유튜브 도메인 권한: 브라우저가 문서·프레임의 GET 요청에서 지정된 인자만 제거합니다. 전체 웹사이트 접근 권한은 요구하지 않습니다. [Chrome 요청 규칙 문서](https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest)
- 기록·분석·외부 서버 전송·원격 코드·계정 접근은 없습니다.
- Chrome 111 이상이 필요합니다. 유튜브 화면 구조가 바뀌면 공유 창 대응을 수정해야 할 수 있습니다.

## 확인 방법

1. 유튜브에서 공유 창을 엽니다. 주소 입력칸에 `si`가 없는지 확인합니다.
2. **복사** 후 메모장에 붙여 넣습니다. 입력칸과 같은 정리된 주소여야 합니다.
3. 시작 시간을 `1:47`로 지정합니다. 짧은 공유 주소에 `?t=107`만 남아야 합니다.
4. 시작 시간을 해제합니다. `?t=107`도 사라져야 합니다.
5. 페이지의 영상 링크를 우클릭하여 주소를 복사합니다. 추적 인자가 없어야 합니다.
6. 메신저 등에서 받은 `https://youtu.be/example1234?si=tracking&t=107` 형식의 링크를 Chrome에서 엽니다. 주소창에는 `?t=107`만 남아야 합니다. 위 주소는 형식 예시이므로 실제 영상 주소로 확인하세요.
7. Facebook·WhatsApp·메시지 공유를 열고 작성 화면에 들어가는 유튜브 주소에 `si`가 없는지 확인합니다. 시간 지정 상태라면 `t`는 유지되어야 합니다.

개발 검증: Node.js 22 이상에서 `npm test`. 규칙 파일을 다시 생성하려면 `npm run build`. 브라우저 검증은 별도 Playwright 설치 후 `PLAYWRIGHT_MODULE`(Playwright 모듈 경로)과 `BROWSER_EXECUTABLE`(확장 로드를 지원하는 Chromium 계열 실행 파일 경로) 환경 변수를 설정합니다.

- `npm run test:browser`: 공유 창 모의 화면, 시간 체크 상태 변경, 복사 API, HTML 복사, 기본 공유, 메시지·소셜 공유 목적지와 팝업을 검증합니다. 외부에 메시지를 전송하지 않습니다.
- `npm run test:extension`: 임시 브라우저에 확장을 실제 로드하여 manifest 자동 주입과 공유 창 주소 정리를 검증합니다.
- `npm run test:incoming`: 실제 확장의 네트워크 규칙을 사용하고 로컬 HTTP 서버에 도착한 URL을 검사하여 원래의 추적 인자가 서버에 전송되지 않았는지 검증합니다. HTTPS의 일반 유튜브·임베드 URL은 브라우저의 규칙 일치 API로 추가 확인합니다.
- 검증 결과: URL·공유 데이터·규칙 관련 31개 테스트와 위 브라우저 검증 통과. 실제 유튜브 서비스 및 외부 메시지 앱의 전송 완료까지 수동 검증한 것은 아닙니다.
- 설치용 ZIP 생성: Python 3에서 `python scripts/package.py`. 결과는 `dist/`에 생성됩니다.
