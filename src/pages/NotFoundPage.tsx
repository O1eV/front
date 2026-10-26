import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <section className="panel empty-state">
      <h1>페이지를 찾을 수 없습니다.</h1>
      <p>주소를 확인하거나 마켓으로 이동해주세요.</p>

      <Link className="primary" to={"/"}>
        마켓으로 이동
      </Link>
    </section>
  );
}
