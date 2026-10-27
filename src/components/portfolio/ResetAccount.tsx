import type { PaperPortfolio } from '../../hooks/usePaperPortfolio';

export function ResetAccount({
    resetOpen,
    setResetOpen,
    resetAccount,
}: Pick<PaperPortfolio, 'resetOpen' | 'setResetOpen' | 'resetAccount'>) {
    return (
        <div className="reset-account">
            {resetOpen ? (
                <>
                    <p>잔고를 1,000만 원으로 되돌리고 보유 종목과 체결 내역을 지울까요?</p>

                    <button
                        onClick={() => {
                            resetAccount();

                            setResetOpen(false);
                        }}
                    >
                        초기화 확인
                    </button>

                    <button onClick={() => setResetOpen(false)}>취소</button>
                </>
            ) : (
                <button onClick={() => setResetOpen(true)}>모의 계좌 초기화</button>
            )}
        </div>
    );
}
