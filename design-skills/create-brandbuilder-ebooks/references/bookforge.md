# BookForge 연계와 출처

원작: https://github.com/gongnyang/bookforge
참조 버전: 3f1e85ee501f5984acb8cd6d92ecb7a4c3fb5374
참조일: 2026-11-15
원작자: gongnyang
라이선스: MIT. 원문은 이 스킬의 ../LICENSE에 보존했다.
브랜드빌더 추가 기여: 강점 기반 집필 관점, 독자별 실무 도구, 편집 디자인 기준, 형식별 분기와 납품 검수.
이 패키지는 원작 엔진 전체를 포함한 포크나 공식 제휴물이 아니다.

## 원작에서 참고한 원리
주제/원고 모드, Markdown 원고와 조판 분리, 표지·목차·장 시작·러닝 시스템·판권면 구성, 자동 게이트 이후 시각 검수.

## BookForge 실행 경로
설치된 BookForge 폴더를 ENGINE, 별도 책 프로젝트를 BOOK으로 정하라. 아래는 셸에서 두 변수를 실제 절대 경로로 지정한 뒤 실행하는 명령이다.
먼저 ENGINE/SKILL.md와 필요한 modes 문서를 읽고 해당 버전의 명령·의존성을 확인하라. 새로 설치할 경우 원작 저장소를 내려받고 위 참조 버전으로 고정해 사용하라. 기존 사용자의 체크아웃을 강제로 되돌리지 마라.

원작 참조 버전은 Typst 0.14.x, PyMuPDF, markdown-it-py가 필요하며 HTML 트랙은 전역 Playwright와 Chromium이 필요하다. 실제 버전별 요구사항은 원작 문서를 우선하라.

```bash
python3 "$ENGINE/scripts/scaffold.py" "$BOOK" --style practical --title "책 제목" --subtitle "부제" --length standard --author "브랜드빌더" --images vector
# 생성된 outline.json과 chapters/ch-NN.md를 작성한 뒤 실행
python3 "$ENGINE/scripts/build.py" "$BOOK"
python3 "$ENGINE/scripts/qc_gate.py" "$BOOK"
python3 "$ENGINE/scripts/contact_sheet.py" "$BOOK"/final/*.pdf "$BOOK/qc" --dpi 90 --pages 1,2,3,4,5
```

마지막 명령은 초기 표본이다. 최종본은 quality.md에 따라 전체 페이지 흐름과 필요한 상세 페이지까지 확인하라.
원작의 practical은 153×225mm, business는 200×280mm이다. 목표 분량은 각 스타일 tokens.json의 length_pages와 대조하라.
이름이 brandbuilder인 원작 스타일은 이 스킬이 제공하지 않는다. 존재하지 않는 --style brandbuilder를 실행하지 마라.
--brand "#FFD400"만으로 Pretendard·배색 역할·로고 편집이 구현되지는 않는다. 대비 계약에 따라 밝은 색이 거절될 수 있으므로 게이트를 약화하지 마라. 정확한 브랜드 디자인이 필요하면 직접 조판 경로를 쓰거나 원작의 references/extending.md에 따라 별도 스타일 팩을 구현·검증하라.

## 원고 계약
- outline.json에 각 장 file/title/summary/toc_line을 넣어라.
- 장 첫 줄은 outline 제목과 일치하는 # 제목으로 작성하라.
- 이미지는 ../assets/ 경로의 단독 문단으로 넣어라.
- 표 캡션은 표 바로 앞에 [표] 제목 | 자료: 출처 형식으로 작성하라.
- 콜아웃은 원작이 정의한 종류와 문법만 사용하라.
- 수치·인용 콜아웃은 본문에도 실제 근거가 있어야 한다.
- 게이트 실패 시 원인을 고쳐라. 분량을 빈 페이지나 불필요한 내용으로 채우지 마라.

## 배포
이 폴더를 재사용할 때 SKILL.md와 references/ 및 LICENSE를 함께 전달하라.
원작 폰트·벤더·코드는 이 패키지에 포함하지 않는다. 별도로 가져오면 해당 라이선스를 유지하라.
-by Brandbuilder-는 추가 편집 관점과 제작 크레딧이며 원작 저작권 고지를 대체하지 않는다.
