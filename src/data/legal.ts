// 법률 문서에 쓰는 공통 값. 아직 정해지지 않은 항목은 [TODO] 자리표시자로 남기고 임의로 채우지 않는다.
export const legalInfo = {
    serviceName: 'OvE',
    operatorName: 'OvE',
    effectiveDate: '[TODO: 시행일]',
    lastRevisedDate: '[TODO: 최종 개정일]',
    cpoName: '이경준',
    cpoTitle: '[TODO: 직책]',
    cpoPhone: '[TODO: 연락처(전화)]',
    cpoEmail: '[TODO: 연락처(이메일)]',
    mailingAddress: '[TODO: 우편 주소]',
} as const;

export const investmentNotice = {
    title: '투자 유의사항',
    lines: [
        'OvE는 모의투자 전용 서비스입니다. 실제 주문·거래는 이루어지지 않습니다.',
        '서비스에서 제공하는 시세, 분석 결과와 매수·관망·매도 신호는 투자 권유가 아닙니다.',
        'AI 신호는 참고용 정보이며 정확성과 수익을 보장하지 않습니다. 투자 판단과 책임은 이용자 본인에게 있습니다.',
    ],
} as const;
