export default function Toast({ msg }: { msg: string }): React.JSX.Element {
  return <div className="toast">{msg}</div>;
}