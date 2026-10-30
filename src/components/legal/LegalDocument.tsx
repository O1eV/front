import { useEffect, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { pagePaths } from '../../routes/paths';
import { legalInfo } from '../../data/legal';
import '../../styles/legal.css';

type LegalDocumentProps = {
    title: string;
    children: ReactNode;
};

// 개인정보 처리방침·이용약관이 함께 쓰는 공개 페이지 틀 (로그인 없이 볼 수 있다)
export function LegalDocument({ title, children }: LegalDocumentProps) {
    const { hash } = useLocation();

    // 라우터는 #앵커로 자동 스크롤하지 않아서, 해시가 가리키는 요소로 직접 이동한다
    useEffect(() => {
        if (!hash) return;
        document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();
    }, [hash]);

    return (
        <div className="legal-page">
            <header className="legal-header">
                <Link className="auth-brand" aria-label="O1eV 홈" to={'/'}>
                    <img src="/logo.png" alt="" width="36" height="36" />
                    <span>O1eV</span>
                </Link>

                <nav className="legal-nav" aria-label="법률 문서">
                    <Link to={pagePaths.terms}>이용약관</Link>
                    <Link to={pagePaths.privacy}>개인정보 처리방침</Link>
                </nav>
            </header>

            <main className="legal-main">
                <article className="legal-document">
                    <h1>{title}</h1>
                    <p className="legal-meta">
                        시행일 {legalInfo.effectiveDate} · 최종 개정일 {legalInfo.lastRevisedDate}
                    </p>
                    <p className="legal-draft" role="note">
                        이 문서는 초안입니다. [TODO] 표시된 항목은 확정 전이며, 서비스 공개 전에
                        법률 검토를 거쳐야 합니다.
                    </p>
                    {children}
                </article>
            </main>
        </div>
    );
}
