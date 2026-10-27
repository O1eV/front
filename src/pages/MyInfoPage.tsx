import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMyInfo, type MyInfo } from '../api/users';
import { useAuthSession, withdraw } from '../lib/auth';
import '../styles/my-info.css';

export function MyInfoPage() {
    const session = useAuthSession();

    return (
        <section className="panel my-info-page">
            <div className="section-heading">
                <div>
                    <h1>내 정보</h1>
                    <p>프로필과 서비스 이용 정보를 확인하세요.</p>
                </div>
            </div>

            {session ? (
                <MyInfoDetails key={session.user.userId} token={session.accessToken} />
            ) : (
                <p className="my-info-message">
                    로그인 후 내 정보를 확인할 수 있어요. <Link to={'/login'}>로그인</Link>
                </p>
            )}
        </section>
    );
}

function MyInfoDetails({ token }: { token: string }) {
    const [retry, setRetry] = useState(0);
    const [state, setState] = useState<{ data?: MyInfo; error?: string }>();

    useEffect(() => {
        const controller = new AbortController();

        getMyInfo(token, controller.signal)
            .then(data => {
                if (!controller.signal.aborted) setState({ data });
            })
            .catch((error: unknown) => {
                if (!controller.signal.aborted)
                    setState({
                        error:
                            error instanceof Error ? error.message : '내 정보를 불러오지 못했어요.',
                    });
            });

        return () => controller.abort();
    }, [token, retry]);

    if (!state)
        return (
            <p className="my-info-message" role="status">
                내 정보를 불러오는 중…
            </p>
        );

    if (state.error)
        return (
            <div className="my-info-message" role="alert">
                <p>{state.error}</p>
                <button
                    type="button"
                    onClick={() => {
                        setState(undefined);
                        setRetry(value => value + 1);
                    }}
                >
                    다시 시도
                </button>{' '}
                <Link to={'/login'}>다시 로그인</Link>
            </div>
        );

    if (!state.data) return null;

    const { user, stats } = state.data;

    return (
        <div className="my-info-body">
            <h2>프로필</h2>
            <dl className="my-info-fields">
                <div>
                    <dt>닉네임</dt>
                    <dd>{user.nickname}</dd>
                </div>
                <div>
                    <dt>이메일</dt>
                    <dd>{user.email}</dd>
                </div>
                <div>
                    <dt>가입일</dt>
                    <dd>
                        {new Date(user.createdAt).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            timeZone: 'Asia/Seoul',
                        })}
                    </dd>
                </div>
            </dl>

            <h2>서비스 이용 정보</h2>
            <dl className="my-info-fields">
                <div>
                    <dt>관심 종목</dt>
                    <dd>{stats.watchlistCount.toLocaleString('ko-KR')}개</dd>
                </div>
                <div>
                    <dt>활성 API 키</dt>
                    <dd>{stats.activeApiKeyCount.toLocaleString('ko-KR')}개</dd>
                </div>
            </dl>
            <p className="my-info-note">
                이용 통계는 서버 기준이며, 현재 관심 종목·API 키 집계는 준비 중입니다.
            </p>
            <WithdrawForm />
        </div>
    );
}

function WithdrawForm() {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmed, setConfirmed] = useState(false);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (pending || !password || !confirmed) return;
        setPending(true);
        setError('');
        try {
            await withdraw(password);
            setPassword('');
            navigate('/login', { replace: true, state: { withdrawn: true } });
        } catch (error) {
            setError(
                error instanceof Error ? error.message : '회원탈퇴에 실패했어요. 다시 시도해주세요.'
            );
        } finally {
            setPending(false);
        }
    }

    return (
        <form className="withdraw-form" onSubmit={handleSubmit}>
            <h2>회원탈퇴</h2>
            <p>
                탈퇴하면 계정을 다시 이용할 수 없으며 개인정보가 익명화돼요. 거래·약관 동의 등 일부
                이력은 서버 정책에 따라 보관됩니다.
            </p>
            <label htmlFor="withdraw-password">현재 비밀번호</label>
            <input
                id="withdraw-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={event => setPassword(event.target.value)}
                required
                disabled={pending}
            />
            <label className="withdraw-confirm">
                <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={event => setConfirmed(event.target.checked)}
                    disabled={pending}
                />
                계정 삭제에 동의합니다.
            </label>
            {error && <p role="alert">{error}</p>}
            <button type="submit" disabled={pending || !password || !confirmed}>
                {pending ? '탈퇴 처리 중…' : '회원탈퇴'}
            </button>
        </form>
    );
}
