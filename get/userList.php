<?php
$_USERS = Array();
foreach(glob($_USERSDIR."/*") as $f){
  $user = basename($f);
  if ($user[0] != "." && is_dir($f)){
      if (!in_array($user, $_USER_IGNORE)){ $_USERS[] = $user; }
  }
}
natcasesort($_USERS);
$_USERS = array_values($_USERS);

$out = Array(
  "result" => 1,
  "users" => $_USERS,
);
print json_encode($out);
?>
