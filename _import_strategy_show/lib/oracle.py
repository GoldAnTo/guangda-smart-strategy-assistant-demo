from typing import List, Tuple, Any, Optional
from dataclasses import dataclass
from contextlib import contextmanager
import os

import oracledb as cx_Oracle


_ORACLE_CLIENT_INITIALIZED = False


def _init_oracle_client() -> None:
    global _ORACLE_CLIENT_INITIALIZED
    if _ORACLE_CLIENT_INITIALIZED:
        return

    lib_dir = os.getenv("ORACLE_CLIENT_LIB_DIR")
    try:
        if lib_dir:
            cx_Oracle.init_oracle_client(lib_dir=lib_dir)
        else:
            cx_Oracle.init_oracle_client()
    except cx_Oracle.ProgrammingError as exc:
        raise RuntimeError(
            "连接 Oracle 11g 需要 python-oracledb Thick 模式。"
            "请安装 Oracle Instant Client，并设置 ORACLE_CLIENT_LIB_DIR。"
        ) from exc

    _ORACLE_CLIENT_INITIALIZED = True


@dataclass
class OracleConfig:
    user: str
    password: str
    dsn: str

    @property
    def connection_string(self) -> str:
        return f"{self.user}/{self.password}@{self.dsn}"


class OracleClient:
    def __init__(self, config: OracleConfig):
        self.config = config
        self._conn: Optional[cx_Oracle.Connection] = None

    @contextmanager
    def get_connection(self):
        _init_oracle_client()
        conn = cx_Oracle.connect(self.config.connection_string)
        try:
            yield conn
        finally:
            conn.close()

    @contextmanager
    def get_cursor(self):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            try:
                yield cursor
            finally:
                cursor.close()

    def test_connection(self) -> bool:
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT 1 FROM DUAL")
                    return True
        except Exception as e:
            print(f"连接失败: {e}")
            return False

    def execute_query(
        self,
        sql: str,
        params: Optional[Tuple] = None
    ) -> List[Tuple]:
        with self.get_cursor() as cursor:
            if params:
                cursor.execute(sql, params)
            else:
                cursor.execute(sql)
            return cursor.fetchall()

    def execute_query_with_columns(
        self,
        sql: str,
        params: Optional[Tuple] = None
    ) -> Tuple[List[str], List[Tuple]]:
        with self.get_cursor() as cursor:
            if params:
                cursor.execute(sql, params)
            else:
                cursor.execute(sql)

            columns = [desc[0] for desc in cursor.description]
            data = cursor.fetchall()
            return columns, data

    def execute_many(
        self,
        sql: str,
        params_list: List[Tuple]
    ) -> int:
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.executemany(sql, params_list)
                conn.commit()
                return cursor.rowcount

    def execute(
        self,
        sql: str,
        params: Optional[Tuple] = None
    ) -> int:
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                if params:
                    cursor.execute(sql, params)
                else:
                    cursor.execute(sql)
                conn.commit()
                return cursor.rowcount

    def execute_scalar(
        self,
        sql: str,
        params: Optional[Tuple] = None
    ) -> Any:
        result = self.execute_query(sql, params)
        if result and len(result) > 0:
            return result[0][0]
        return None
