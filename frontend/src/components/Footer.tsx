export default function Footer() {
  return (
    <footer className="border-t border-border py-8 text-center text-sm text-muted">
      <div className="container-main">
        <p>&copy; {new Date().getFullYear()} Blogger. All rights reserved.</p>
      </div>
    </footer>
  );
}

