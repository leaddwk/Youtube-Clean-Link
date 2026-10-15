# Chrome 웹 스토어 제출 안내 — 1.1.1

이 자료는 제출을 준비한 것이며, 스토어에 등록되었거나 Google의 승인을 받은 상태를 뜻하지 않습니다.

## 업로드할 파일

**`youtube-clean-link-1.1.1-webstore.zip`만 새 항목 업로드에 사용합니다.** 이 ZIP의 최상위에는 `manifest.json`이 있습니다. `submission-kit.zip`은 설명·이미지까지 묶은 자료 모음으로, 스토어 업로드용이 아닙니다. GitHub의 Download ZIP도 소스 폴더를 포함하므로 직접 업로드하지 않습니다.

파일 생성: `python scripts/package.py`. 스크린샷과 아이콘 재생성은 `scripts/store-assets.cjs`를 참고하세요.

## 등록 절차

1. [개발자 대시보드](https://chrome.google.com/webstore/devconsole)에 본인의 Google 계정으로 로그인합니다.
2. 아직 개발자 계정이 없다면 계정 등록, 개발자 연락 이메일 확인, 계정 보안 설정 등 대시보드가 요구하는 절차를 완료합니다. 최초 등록에는 일회성 등록비와 약관 동의가 필요합니다. 계정·결제·약관 확인은 계정 소유자가 직접 진행합니다.
3. 새 항목을 만들고 `youtube-clean-link-1.1.1-webstore.zip`을 업로드합니다.
4. `store/listing.ko.md`의 제목·설명을 입력합니다. 실제 제출 언어와 가장 가까운 분류를 선택합니다.
5. 이미지는 아래 파일을 사용합니다.
6. 개인정보처리방침 URL을 등록하고, `store/privacy-answers.ko.md`를 기준으로 단일 목적·권한·원격 코드·데이터 처리 내용을 입력합니다.
7. 문의 URL을 등록합니다. 공개 개발자 이메일, 배포 지역, 공개 범위, 판매자 관련 정보는 본인의 실제 상황에 맞게 입력합니다. 이 자료는 해당 개인 정보를 임의로 채우지 않습니다.
8. 아래 실제 서비스 점검을 완료한 뒤 대시보드의 검증 결과를 확인하고 심사를 제출합니다.

## 이미지

| 대시보드 입력란 | 파일 | 규격 |
| --- | --- | --- |
| 스토어 아이콘 | `store/assets/icon-128.png` | 128×128 PNG, 투명 여백 |
| 스크린샷 1 | `store/assets/screenshot-01.png` | 1280×800 PNG |
| 스크린샷 2 | `store/assets/screenshot-02.png` | 1280×800 PNG |
| 작은 홍보 타일 | `store/assets/promo-440x280.png` | 440×280 PNG |

스크린샷은 제출 파일에서 실행한 실제 확장 팝업을 촬영해 설명과 함께 배치한 이미지입니다. 예시 주소를 사용하며, 유튜브 화면이나 스토어 승인 표시를 합성하지 않습니다. 홍보 이미지는 독립적으로 제작한 링크·체크 모티프입니다. 스크린샷은 24-bit RGB PNG로 출력합니다.

## 검증과 실제 서비스 점검

- 자동: 정리 로직, 시작 시간 유지, 소셜 공유 URL, 패키지 루트·파일 목록·아이콘·보안 설정 검증.
- 브라우저: 임시 프로필에 **스토어 ZIP을 풀어서** 로드하고, 공유 창 모의 화면·팝업·정적 요청 규칙을 검사합니다. 로컬 서버에서는 추적값이 제거된 URL만 수신하는지 확인합니다.
- 실제 서비스 수동 점검: YouTube 공유 창에서 시간 지정/해제, 복사 후 붙여넣기, 메시지·Facebook·WhatsApp 작성 화면에 전달되는 URL을 확인합니다. 테스트 목적으로 실제 메시지를 전송할 필요는 없습니다.
- 제작 환경에서는 위 자동·로컬 브라우저 검증을 수행합니다. 실제 YouTube 서비스와 외부 앱의 작성 화면 전체를 수동 검증한 것으로 간주하지 않습니다. 제출 전 계정 소유자의 사용 환경에서 마지막 항목을 확인하세요.

## 참고한 공식 요건

- 패키지·manifest: https://developer.chrome.com/docs/webstore/prepare
- 이미지: https://developer.chrome.com/docs/webstore/images
- 권한·개인정보: https://developer.chrome.com/docs/webstore/cws-dashboard-privacy
- 기기 내부 데이터 처리 공개: https://developer.chrome.com/docs/webstore/program-policies/user-data-faq
- 상표·독립성 표시: https://developer.chrome.com/docs/webstore/branding
- 개발자 등록: https://developer.chrome.com/docs/webstore/register

확인일: 2026년 10월 15일. 실제 등록 화면이나 심사에서 추가 자료를 요청할 수 있습니다.
