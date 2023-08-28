<?php

if (!function_exists('str_ends_with')) {
    function str_ends_with(string $haystack, string $needle): bool
    {
        $needle_len = strlen($needle);
        return ($needle_len === 0 || 0 === substr_compare($haystack, $needle, -$needle_len));
    }
}

include "common.php";

function kill_queued($user)
{
    $killfile = make_path($user, ".cncfm", "kill", false);
    if (file_exists($killfile)) {
        $killpids = explode("\n", file_get_contents($killfile));
        print_r($killpids);
        foreach ($killpids as $pid) {
            if (!empty($pid)) {
                $pid = intval($pid);
                echo "killing $pid\n";
                $childProcesses = [];
                $output = shell_exec("pgrep -P $pid");
                if ($output) {
                    $childProcesses = explode("\n", trim($output));
                    foreach ($childProcesses as $childPID) {
                        echo "killing child: $childPID\n";
                        posix_kill($childPID, 9);
                    }
                }
                posix_kill($pid, 9);
            }
        }
        unlink($killfile);
    }
}

function job_running($user)
{
    $runfile = make_path($user, ".cncfm", "run", false);
    if (!file_exists($runfile)) {
        return false;
    }

    $run = explode("\n", file_get_contents($runfile));
    $jobid = $run[0];
    $pid = $run[1];

    // This only works on Linux.
    if (!file_exists("/proc/$pid")) {
        echo "error: run file but no active pid ($pid)\n";
        @unlink($runfile);

        $qpath = make_path($user, ".cncfm", "$jobid.*", false);
        foreach (glob($qpath) as $filename) {
            echo "removing: $filename\n";
            unlink($filename);
        }

    }
    return true;
}

function get_job($user)
{
    $path = make_path($user, ".cncfm", "", false);
    if (file_exists($path)) {
        $jobs = @scandir($path);
        natsort($jobs);
        if (count($jobs)) {
            foreach ($jobs as $q) {
                if (str_ends_with($q, ".job") && valid_name($q)) {
                    $jobid = basename($q, ".job");
                    return $jobid;
                }
            }
        }
    }
    return false;

}

function job_error($user, $jobid, $e)
{
    $jobfile = make_path($user, ".cncfm", "$jobid.job", false);

    $errorfile = make_path($user, ".cncfm", "$jobid.fail", false);
    @mkdir(dirname($errorfile), 0770, true);
    rename($jobfile, $errorfile);

    $logfile = make_path($user, ".cncfm", "$jobid.log", false);
    file_put_contents($logfile, $e);

    echo "ERROR: $e\n";
}

function job_run($user, $jobid)
{
    global $_C;
    $pid = getmypid();
    echo "running $jobid ($pid)\n";

    try {

        $runfile = make_path($user, ".cncfm", "run", false);
        file_put_contents($runfile, "$jobid\n$pid");

        $jobfile = make_path($user, ".cncfm", "$jobid.job", false);
        $job = json_decode(file_get_contents($jobfile), true);

        $datafile = make_path($user, ".cncfm", "$jobid.data", false);
        //echo $datafile;
        $data = @file_get_contents($datafile);
        if (empty($data)) {
            throw new Exception("Empty or Missing Data file");
        }

        $uploader = $job["uploader"];
        $runner = $_C["PLUGIN_DIR"] . "/uploaders/$uploader/run.php";

        echo "runner: $runner\n";
        include $runner;
        echo "runner: done\n";

    } catch (Throwable $e) {

        job_error($user, $jobid, $e);

    }

    echo "removing: $jobfile\n";
    unlink($jobfile);
    echo "removing: $datafile\n";
    unlink($datafile);
    echo "removing $runfile\n";
    unlink($runfile);

}

function job_meta($user, $location, $origname, $newname, $data)
{
    $metadir = make_path($user, ".cncfm/meta/" . $location, basename($newname), false);
    @mkdir($metadir, 0770, true);

    $metafile = "$metadir/meta.json";
    $origfile = "$metadir/orig.data";

    $output = [
        "user" => $user,
        "location" => $location,
        "original" => $origname,
    ];
    file_put_contents($metafile, json_encode($output));
    file_put_contents($origfile, $data);
}

$users = scandir($_C["USER_DIR"]);
foreach ($users as $user) {
    if (valid_name($user)) {
        kill_queued($user);
        if (!job_running($user)) {
            $jobid = get_job($user);
            if ($jobid) {
                job_run($user, $jobid);
                echo "------------------------------------------------\n";
                break;
            }
        }
    }
}